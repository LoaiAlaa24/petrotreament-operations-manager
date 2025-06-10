from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import and_
import models
import schemas
from database import get_db
from routers.auth import get_current_user, require_super_admin, require_admin_or_above
from company_rates_config import get_company_rate, get_all_company_rates, DEFAULT_RATE_USD, DEFAULT_RATE_EGP
from datetime import datetime, timedelta
import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfutils
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen import canvas
from PyPDF2 import PdfReader, PdfWriter
import os

# Use standard fonts for English-only reports
PDF_FONT = 'Helvetica'
PDF_FONT_BOLD = 'Helvetica-Bold'

def clean_text_for_pdf(text: str) -> str:
    """Clean text for PDF rendering to avoid font issues"""
    if not text:
        return ""
    
    # Handle None values
    if text is None:
        return ""
    
    # Convert to string and strip
    text = str(text).strip()
    
    # Replace problematic characters that might not render properly
    text = text.replace('\x00', '')  # Remove null bytes
    text = text.replace('\r\n', ' ')  # Replace line breaks
    text = text.replace('\n', ' ')    # Replace newlines
    text = text.replace('\r', ' ')    # Replace carriage returns
    
    return text

def translate_to_english(text: str) -> str:
    """Translate Arabic text back to English for PDF reports"""
    if not text:
        return text
    
    # Company name translations (Arabic to English)
    company_translations = {
        'بترونيفرتيتي': 'Petroneverty',
        'يونيكو': 'UNICO', 
        'نسكو شمال سيناء': 'NESCO North Sinai',
        'العسرية للبترول': 'Al-Asriya Petroleum',
        'سيناء غاز': 'Sinai Gas',
        'أخرى': 'Other'
    }
    
    # Water type translations (Arabic to English)
    water_type_translations = {
        'نفايات خطرة': 'Hazardous Waste',
        'نفايات غير خطرة': 'Non-Hazardous Waste',
        'زيوت': 'Oils',
        'طافلة': 'Oil Based Mud waste (OBM)',
        'مياه ملوثة': 'Contaminated Water',
        'حمأة': 'Sludge',
        'نفايات صناعية': 'Industrial Waste',
        'مياه ملوثة بالزيت': 'Oil Contaminated Water',
        'نفايات كيميائية': 'Chemical Waste',
        'أخرى': 'Other'
    }
    
    # Check if it's a company name
    if text in company_translations:
        return company_translations[text]
    
    # Check if it's a water type
    if text in water_type_translations:
        return water_type_translations[text]
    
    # If no translation found, return original text
    return text


def create_overlay_pdf(receptions: list, report_info: dict) -> bytes:
    """Create an overlay PDF with report content to be merged with template"""
    
    buffer = io.BytesIO()
    # Use A4 size to match typical templates
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    # Start from top of page, leaving space for template header
    y_position = height - 200  # Start below template header
    
    # Report title and info
    c.setFont(PDF_FONT_BOLD, 16)
    title_text = f"Vehicle Reception Report - {report_info['type'].title()}"
    c.drawString((width - c.stringWidth(title_text, PDF_FONT_BOLD, 16)) / 2, y_position, title_text)
    
    y_position -= 30
    c.setFont(PDF_FONT, 12)
    
    # Report info
    report_info_text = [
        f"Report Period: {report_info['start_date'].strftime('%Y-%m-%d')} to {report_info['end_date'].strftime('%Y-%m-%d')}",
        f"Generated On: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        f"Total Records: {len(receptions)}"
    ]
    
    if report_info.get('total_vehicles'):
        report_info_text.append(f"Total Vehicles: {report_info['total_vehicles']}")
    
    if report_info.get('total_quantity'):
        report_info_text.append(f"Total Quantity: {report_info['total_quantity']:.2f} m³")
    
    for info in report_info_text:
        c.drawString(50, y_position, info)
        y_position -= 20
    
    y_position -= 20
    
    if receptions:
        # Table headers - optimized for A4 width
        headers = ['Date', 'Company', 'Vehicles', 'Water Type', 'Quantity (m³)', 'Arrival', 'Departure']
        
        # Calculate column widths to fit A4 page (max width ~495 points with margins)
        col_widths = [70, 105, 45, 85, 65, 50, 50]  # Total: 470 points
        x_positions = [50]
        for width in col_widths[:-1]:
            x_positions.append(x_positions[-1] + width)
        
        def draw_table_headers(y_pos):
            """Helper function to draw table headers"""
            c.setFont(PDF_FONT_BOLD, 9)
            for i, header in enumerate(headers):
                c.drawString(x_positions[i], y_pos, header)
            y_pos -= 12
            # Draw line under headers
            c.line(50, y_pos, sum(col_widths) + 50, y_pos)
            return y_pos - 8
        
        # Draw initial headers
        y_position = draw_table_headers(y_position)
        
        # Draw data rows
        c.setFont(PDF_FONT, 8)
        for reception in receptions:
            # Check if we need a new page (ensure space for at least 2 rows)
            if y_position < 120:  # Start new page if near bottom
                c.showPage()
                # Reset to template spacing for new page
                y_position = height - 200  # Start below template header
                # Redraw headers on new page
                y_position = draw_table_headers(y_position)
                c.setFont(PDF_FONT, 8)
            
            row_data = [
                reception.date.strftime('%m/%d'),  # Shorter date format
                clean_text_for_pdf(translate_to_english(reception.company_name))[:12],  # Truncate company names
                str(reception.number_of_vehicles),
                clean_text_for_pdf(translate_to_english(reception.water_type))[:10],  # Truncate water type
                f"{reception.total_quantity:.1f}",  # One decimal place
                reception.arrival_time.strftime('%H:%M') if reception.arrival_time else '-',
                reception.departure_time.strftime('%H:%M') if reception.departure_time else '-'
            ]
            
            for i, data in enumerate(row_data):
                # Handle text wrapping for long content
                if len(str(data)) * 6 > col_widths[i]:  # Rough character width estimate
                    data = str(data)[:int(col_widths[i]/6)] + "..."
                c.drawString(x_positions[i], y_position, str(data))
            
            y_position -= 12  # Reduced row height for more content per page
    else:
        c.drawString(50, y_position, "No records found for the specified period.")
    
    c.save()
    buffer.seek(0)
    
    return buffer.getvalue()


def create_financial_overlay_pdf(financial_data: dict) -> bytes:
    """Create an overlay PDF with financial report content"""
    
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    # Start from top of page, leaving space for template header
    y_position = height - 200
    
    # Report title
    c.setFont(PDF_FONT_BOLD, 16)
    title_text = "Financial Cost Summary Report"
    c.drawString((width - c.stringWidth(title_text, PDF_FONT_BOLD, 16)) / 2, y_position, title_text)
    
    y_position -= 30
    c.setFont(PDF_FONT, 12)
    
    # Report info
    report_info_text = [
        f"Report Period: {financial_data['period_start']} to {financial_data['period_end']}",
        f"Generated On: {financial_data['generated_at'].strftime('%Y-%m-%d %H:%M:%S')}",
        f"Total Companies: {len(financial_data['companies'])}",
        f"Total Volume: {financial_data['total_volume_m3']:.2f} m³",
        f"Total Cost: ${financial_data['total_cost']:,.2f}"
    ]
    
    for info in report_info_text:
        c.drawString(50, y_position, info)
        y_position -= 20
    
    y_position -= 20
    
    if financial_data['companies']:
        # Table headers - optimized for A4 width
        headers = ['Company Name', 'Volume (m³)', 'Rate per m³', 'Total Cost', 'Receptions']
        
        # Calculate column widths to fit A4 page (max width ~495 points with margins)
        col_widths = [130, 75, 75, 95, 70]  # Total: 445 points
        x_positions = [50]
        for width in col_widths[:-1]:
            x_positions.append(x_positions[-1] + width)
        
        def draw_financial_headers(y_pos):
            """Helper function to draw financial table headers"""
            c.setFont(PDF_FONT_BOLD, 9)
            for i, header in enumerate(headers):
                c.drawString(x_positions[i], y_pos, header)
            y_pos -= 12
            # Draw line under headers
            c.line(50, y_pos, sum(col_widths) + 50, y_pos)
            return y_pos - 8
        
        # Draw initial headers
        y_position = draw_financial_headers(y_position)
        
        # Draw data rows
        c.setFont(PDF_FONT, 8)
        for company_data in financial_data['companies']:
            # Check if we need a new page (ensure space for at least 2 rows + totals)
            if y_position < 150:  # Start new page if near bottom
                c.showPage()
                # Reset to template spacing for new page
                y_position = height - 200  # Start below template header
                # Redraw headers on new page
                y_position = draw_financial_headers(y_position)
                c.setFont(PDF_FONT, 8)
            
            # Format rate and cost with proper currency
            currency = company_data.get('currency', 'USD')
            currency_symbol = '$' if currency == 'USD' else 'EGP'
            
            row_data = [
                clean_text_for_pdf(translate_to_english(company_data['company_name']))[:16],  # Truncate company names
                f"{company_data['total_volume_m3']:.1f}",  # One decimal place
                f"{currency_symbol}{company_data['rate_per_m3']:.2f}",
                f"{currency_symbol}{company_data['total_cost']:,.0f}",  # No decimal for cost display
                str(company_data['reception_count'])
            ]
            
            for i, data in enumerate(row_data):
                # Handle text wrapping for long content
                if len(str(data)) * 6 > col_widths[i]:  # Rough character width estimate
                    data = str(data)[:int(col_widths[i]/6)] + "..."
                c.drawString(x_positions[i], y_position, str(data))
            
            y_position -= 12  # Reduced row height for more content per page
        
        # Add totals row with spacing
        y_position -= 8
        c.setFont(PDF_FONT_BOLD, 9)
        
        # Draw separator line before totals
        c.line(50, y_position + 4, sum(col_widths) + 50, y_position + 4)
        
        totals_data = [
            'TOTAL',
            f"{financial_data['total_volume_m3']:.1f}",
            '-',
            f"${financial_data['total_cost']:,.0f}",
            str(sum(c['reception_count'] for c in financial_data['companies']))
        ]
        
        for i, data in enumerate(totals_data):
            c.drawString(x_positions[i], y_position, str(data))
    else:
        c.drawString(50, y_position, "No financial data found for the specified period.")
    
    c.save()
    buffer.seek(0)
    
    return buffer.getvalue()


def merge_with_template(overlay_pdf_bytes: bytes, is_financial: bool = False) -> bytes:
    """Merge overlay content with the PDF template"""
    
    template_path = "/app/template.pdf"
    
    # Check if template exists
    if not os.path.exists(template_path):
        print(f"⚠️ Template not found at {template_path}, using overlay only")
        return overlay_pdf_bytes
    
    try:
        # Read the template
        template_reader = PdfReader(template_path)
        overlay_reader = PdfReader(io.BytesIO(overlay_pdf_bytes))
        
        writer = PdfWriter()
        
        # Process each page of the overlay
        for page_num in range(len(overlay_reader.pages)):
            # Get template page (use first page for all overlay pages)
            if len(template_reader.pages) > 0:
                template_page = template_reader.pages[0]
                overlay_page = overlay_reader.pages[page_num]
                
                # Merge overlay onto template
                template_page.merge_page(overlay_page)
                writer.add_page(template_page)
            else:
                # If no template, just use overlay
                writer.add_page(overlay_reader.pages[page_num])
        
        # Write the merged PDF
        output_buffer = io.BytesIO()
        writer.write(output_buffer)
        output_buffer.seek(0)
        
        print(f"✅ Successfully merged report with template")
        return output_buffer.getvalue()
        
    except Exception as e:
        print(f"❌ Error merging with template: {str(e)}")
        print(f"⚠️ Returning overlay PDF without template")
        return overlay_pdf_bytes


router = APIRouter()


def generate_financial_pdf_report(financial_data: dict) -> bytes:
    """Generate financial PDF report using template"""
    
    # Create overlay with financial data
    overlay_pdf_bytes = create_financial_overlay_pdf(financial_data)
    
    # Merge with template
    return merge_with_template(overlay_pdf_bytes, is_financial=True)


def generate_pdf_report(receptions: list, report_info: dict) -> bytes:
    """Generate PDF report using template"""
    
    # Create overlay with report data
    overlay_pdf_bytes = create_overlay_pdf(receptions, report_info)
    
    # Merge with template
    return merge_with_template(overlay_pdf_bytes, is_financial=False)


@router.post("/generate")
async def generate_report(
    report_request: schemas.ReportRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_above)
):
    """Generate and return PDF report"""
    
    # Parse dates
    try:
        start_dt = datetime.strptime(report_request.start_date, '%Y-%m-%d')
        end_dt = datetime.strptime(report_request.end_date, '%Y-%m-%d')
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    
    # Build query
    query = db.query(models.VehicleReception).filter(
        models.VehicleReception.is_active == True,
        models.VehicleReception.date >= start_dt,
        models.VehicleReception.date <= end_dt
    )
    
    # Apply filters
    if report_request.company_filter:
        query = query.filter(
            models.VehicleReception.company_name.ilike(f"%{report_request.company_filter}%")
        )
    
    if report_request.water_type_filter:
        query = query.filter(
            models.VehicleReception.water_type.ilike(f"%{report_request.water_type_filter}%")
        )
    
    # Get data
    receptions = query.order_by(models.VehicleReception.date).all()
    
    # Calculate summary stats
    total_vehicles = sum(r.number_of_vehicles for r in receptions)
    total_quantity = sum(r.total_quantity for r in receptions)
    
    # Report info
    report_info = {
        'type': report_request.report_type,
        'start_date': start_dt,
        'end_date': end_dt,
        'total_vehicles': total_vehicles,
        'total_quantity': total_quantity
    }
    
    # Generate PDF
    pdf_content = generate_pdf_report(receptions, report_info)
    
    # Generate filename
    filename = f"vehicle_reception_report_{report_request.report_type}_{start_dt.strftime('%Y%m%d')}_{end_dt.strftime('%Y%m%d')}.pdf"
    
    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/summary")
async def get_report_summary(
    start_date: str,
    end_date: str,
    company_filter: Optional[str] = None,
    water_type_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_above)
):
    """Get summary statistics for report period"""
    
    # Parse dates
    try:
        start_dt = datetime.strptime(start_date, '%Y-%m-%d')
        end_dt = datetime.strptime(end_date, '%Y-%m-%d')
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    
    # Build query
    query = db.query(models.VehicleReception).filter(
        models.VehicleReception.is_active == True,
        models.VehicleReception.date >= start_dt,
        models.VehicleReception.date <= end_dt
    )
    
    # Apply filters
    if company_filter:
        query = query.filter(
            models.VehicleReception.company_name.ilike(f"%{company_filter}%")
        )
    
    if water_type_filter:
        query = query.filter(
            models.VehicleReception.water_type.ilike(f"%{water_type_filter}%")
        )
    
    receptions = query.all()
    
    if not receptions:
        return {
            "total_receptions": 0,
            "total_vehicles": 0,
            "total_quantity": 0,
            "average_vehicles_per_day": 0,
            "average_quantity_per_day": 0,
            "companies": [],
            "water_types": []
        }
    
    # Calculate statistics
    total_receptions = len(receptions)
    total_vehicles = sum(r.number_of_vehicles for r in receptions)
    total_quantity = sum(r.total_quantity for r in receptions)
    
    # Calculate averages per day
    days_in_period = (end_dt - start_dt).days + 1
    average_vehicles_per_day = total_vehicles / days_in_period if days_in_period > 0 else 0
    average_quantity_per_day = total_quantity / days_in_period if days_in_period > 0 else 0
    
    # Get unique values
    companies = list(set(r.company_name for r in receptions))
    water_types = list(set(r.water_type for r in receptions))
    
    # Company breakdown
    company_stats = {}
    for company in companies:
        company_receptions = [r for r in receptions if r.company_name == company]
        company_stats[company] = {
            "receptions": len(company_receptions),
            "vehicles": sum(r.number_of_vehicles for r in company_receptions),
            "quantity": sum(r.total_quantity for r in company_receptions)
        }
    
    # Water type breakdown
    water_type_stats = {}
    for water_type in water_types:
        water_type_receptions = [r for r in receptions if r.water_type == water_type]
        water_type_stats[water_type] = {
            "receptions": len(water_type_receptions),
            "vehicles": sum(r.number_of_vehicles for r in water_type_receptions),
            "quantity": sum(r.total_quantity for r in water_type_receptions)
        }
    
    return {
        "period": {
            "start_date": start_dt.isoformat(),
            "end_date": end_dt.isoformat(),
            "days": days_in_period
        },
        "totals": {
            "receptions": total_receptions,
            "vehicles": total_vehicles,
            "quantity": total_quantity
        },
        "averages": {
            "vehicles_per_day": round(average_vehicles_per_day, 2),
            "quantity_per_day": round(average_quantity_per_day, 2)
        },
        "breakdowns": {
            "companies": company_stats,
            "water_types": water_type_stats
        }
    }


@router.post("/financial/generate")
async def generate_financial_report(
    report_request: schemas.FinancialReportRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_super_admin)
):
    """Generate and return financial PDF report with cost calculations"""
    
    # Parse dates
    try:
        start_dt = datetime.strptime(report_request.start_date, '%Y-%m-%d')
        end_dt = datetime.strptime(report_request.end_date, '%Y-%m-%d')
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    
    # Build query
    query = db.query(models.VehicleReception).filter(
        models.VehicleReception.is_active == True,
        models.VehicleReception.date >= start_dt,
        models.VehicleReception.date <= end_dt
    )
    
    # Apply company filter if provided
    if report_request.company_filter:
        query = query.filter(
            models.VehicleReception.company_name.ilike(f"%{report_request.company_filter}%")
        )
    
    # Get data
    receptions = query.order_by(models.VehicleReception.date).all()
    
    if not receptions:
        # Return empty report if no data
        financial_data = {
            'period_start': start_dt.strftime('%Y-%m-%d'),
            'period_end': end_dt.strftime('%Y-%m-%d'),
            'companies': [],
            'total_volume_m3': 0.0,
            'total_cost': 0.0,
            'generated_at': datetime.now()
        }
    else:
        # Calculate financial data by company
        company_data = {}
        for reception in receptions:
            company = reception.company_name
            if company not in company_data:
                company_data[company] = {
                    'total_volume': 0.0,
                    'reception_count': 0
                }
            company_data[company]['total_volume'] += reception.total_quantity
            company_data[company]['reception_count'] += 1
        
        # Build company financial summaries
        companies = []
        total_volume = 0.0
        total_cost = 0.0
        
        for company_name, data in company_data.items():
            volume = data['total_volume']
            
            # Get rate information with currency
            rate_info = get_company_rate(company_name)
            rate_value = rate_info['rate']
            currency = rate_info['currency']
            
            # Calculate cost
            cost = volume * rate_value
            total_volume += volume
            total_cost += cost  # Note: mixing currencies - should be handled in display
            
            companies.append({
                'company_name': company_name,
                'total_volume_m3': volume,
                'rate_per_m3': rate_value,
                'currency': currency,
                'total_cost': cost,
                'reception_count': data['reception_count']
            })
        
        # Sort companies by total cost (descending)
        companies.sort(key=lambda x: x['total_cost'], reverse=True)
        
        financial_data = {
            'period_start': start_dt.strftime('%Y-%m-%d'),
            'period_end': end_dt.strftime('%Y-%m-%d'),
            'companies': companies,
            'total_volume_m3': total_volume,
            'total_cost': total_cost,
            'generated_at': datetime.now()
        }
    
    # Generate PDF
    pdf_content = generate_financial_pdf_report(financial_data)
    
    # Generate filename
    filename = f"financial_report_{start_dt.strftime('%Y%m%d')}_{end_dt.strftime('%Y%m%d')}.pdf"
    
    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/financial/summary")
async def get_financial_summary(
    start_date: str,
    end_date: str,
    company_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_super_admin)
):
    """Get financial summary for the specified period"""
    
    # Parse dates
    try:
        start_dt = datetime.strptime(start_date, '%Y-%m-%d')
        end_dt = datetime.strptime(end_date, '%Y-%m-%d')
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    
    # Build query
    query = db.query(models.VehicleReception).filter(
        models.VehicleReception.is_active == True,
        models.VehicleReception.date >= start_dt,
        models.VehicleReception.date <= end_dt
    )
    
    # Apply company filter if provided
    if company_filter:
        query = query.filter(
            models.VehicleReception.company_name.ilike(f"%{company_filter}%")
        )
    
    receptions = query.all()
    
    if not receptions:
        return schemas.FinancialReportSummary(
            period_start=start_date,
            period_end=end_date,
            companies=[],
            total_volume_m3=0.0,
            total_cost=0.0,
            generated_at=datetime.now()
        )
    
    # Calculate financial data by company
    company_data = {}
    for reception in receptions:
        company = reception.company_name
        if company not in company_data:
            company_data[company] = {
                'total_volume': 0.0,
                'reception_count': 0
            }
        company_data[company]['total_volume'] += reception.total_quantity
        company_data[company]['reception_count'] += 1
    
    # Build company financial summaries
    companies = []
    total_volume = 0.0
    total_cost = 0.0
    
    for company_name, data in company_data.items():
        volume = data['total_volume']
        company_rate = get_company_rate(company_name)
        cost = volume * company_rate
        total_volume += volume
        total_cost += cost
        
        companies.append(schemas.CompanyFinancialSummary(
            company_name=company_name,
            total_volume_m3=volume,
            rate_per_m3=company_rate,
            total_cost=cost,
            reception_count=data['reception_count']
        ))
    
    # Sort companies by total cost (descending)
    companies.sort(key=lambda x: x.total_cost, reverse=True)
    
    return schemas.FinancialReportSummary(
        period_start=start_date,
        period_end=end_date,
        companies=companies,
        total_volume_m3=total_volume,
        total_cost=total_cost,
        generated_at=datetime.now()
    )


@router.get("/company-rates")
async def get_company_rates(current_user: models.User = Depends(require_super_admin)):
    """Get all company rates configuration"""
    return {
        "rates": get_all_company_rates(),
        "default_rate_usd": DEFAULT_RATE_USD,
        "default_rate_egp": DEFAULT_RATE_EGP,
        "currency_support": ["USD", "EGP"],
        "waste_types": ["نفايات خطرة", "نفايات غير خطرة", "زيوت", "طافلة", "مياه ملوثة", "حمأة", "نفايات صناعية", "مياه ملوثة بالزيت", "نفايات كيميائية", "أخرى"]
    }