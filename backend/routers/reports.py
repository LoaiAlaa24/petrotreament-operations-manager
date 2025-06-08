from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import and_
import models
import schemas
from database import get_db
from routers.auth import get_current_user, require_super_admin, require_admin_or_above
from company_rates_config import get_company_rate, get_all_company_rates, DEFAULT_RATE_PER_M3
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
import os

# Register Unicode-supporting font
def register_unicode_font():
    """Register a Unicode font for proper text rendering"""
    try:
        # Try to register DejaVu Sans which supports Arabic and special characters
        font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
        if os.path.exists(font_path):
            pdfmetrics.registerFont(TTFont('DejaVuSans', font_path))
            pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))
            return 'DejaVuSans'
    except:
        pass
    
    try:
        # Fallback to Arial Unicode if available
        font_path = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
        if os.path.exists(font_path):
            pdfmetrics.registerFont(TTFont('LiberationSans', font_path))
            pdfmetrics.registerFont(TTFont('LiberationSans-Bold', "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"))
            return 'LiberationSans'
    except:
        pass
    
    # Default to Helvetica if no Unicode font available
    return 'Helvetica'

# Get the best available font
UNICODE_FONT = register_unicode_font()
UNICODE_FONT_BOLD = f'{UNICODE_FONT}-Bold' if UNICODE_FONT != 'Helvetica' else 'Helvetica-Bold'

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

router = APIRouter()


def generate_financial_pdf_report(financial_data: dict) -> bytes:
    """Generate financial PDF report from company financial data"""
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    
    # Get styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=30,
        alignment=1,  # Center
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=20,
        alignment=1,  # Center
    )
    
    # Build content
    content = []
    
    # Header with logo and title
    logo_path = "/app/header.jpg"
    if os.path.exists(logo_path):
        try:
            logo = Image(logo_path, width=431, height=117)
            logo.hAlign = 'CENTER'
            content.append(logo)
            content.append(Spacer(1, 12))
        except:
            pass  # If logo fails to load, continue without it
    
    # Title
    title = Paragraph("Petrotreatment Operation Manager<br/>Financial Cost Summary Report", title_style)
    content.append(title)
    content.append(Spacer(1, 12))
    
    # Report info
    info_data = [
        ['Report Period:', f"{financial_data['period_start']} to {financial_data['period_end']}"],
        ['Generated On:', financial_data['generated_at'].strftime('%Y-%m-%d %H:%M:%S')],
        ['Total Companies:', str(len(financial_data['companies']))],
        ['Total Volume:', f"{financial_data['total_volume_m3']:.2f} m³"],
        ['Total Cost:', f"${financial_data['total_cost']:,.2f}"],
    ]
    
    info_table = Table(info_data, colWidths=[2*inch, 3*inch])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), UNICODE_FONT),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    content.append(info_table)
    content.append(Spacer(1, 20))
    
    # Company financial breakdown
    if financial_data['companies']:
        subtitle = Paragraph("Cost Breakdown by Company", subtitle_style)
        content.append(subtitle)
        content.append(Spacer(1, 12))
        
        # Financial table
        table_data = [
            ['Company Name', 'Volume (m³)', 'Rate per m³', 'Total Cost', 'Receptions']
        ]
        
        for company_data in financial_data['companies']:
            row = [
                clean_text_for_pdf(company_data['company_name']),
                f"{company_data['total_volume_m3']:.2f}",
                f"${company_data['rate_per_m3']:.2f}",
                f"${company_data['total_cost']:,.2f}",
                str(company_data['reception_count'])
            ]
            table_data.append(row)
        
        # Add totals row
        table_data.append([
            'TOTAL',
            f"{financial_data['total_volume_m3']:.2f}",
            '-',
            f"${financial_data['total_cost']:,.2f}",
            str(sum(c['reception_count'] for c in financial_data['companies']))
        ])
        
        # Create table
        financial_table = Table(table_data, repeatRows=1)
        financial_table.setStyle(TableStyle([
            # Header row styling
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), UNICODE_FONT_BOLD),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            
            # Data rows styling
            ('BACKGROUND', (0, 1), (-1, -2), colors.beige),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTNAME', (0, 1), (-1, -2), UNICODE_FONT),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ALIGN', (0, 1), (-1, -1), 'CENTER'),
            
            # Totals row styling
            ('BACKGROUND', (0, -1), (-1, -1), colors.darkgrey),
            ('TEXTCOLOR', (0, -1), (-1, -1), colors.black),
            ('FONTNAME', (0, -1), (-1, -1), UNICODE_FONT_BOLD),
            ('FONTSIZE', (0, -1), (-1, -1), 10),
            
            # Grid
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        content.append(financial_table)
        content.append(Spacer(1, 20))
        
        # Add a note about rates
        note = Paragraph(
            "<b>Note:</b> Rates per m³ are configured per company. "
            "Contact system administrator to modify company-specific rates.",
            styles['Normal']
        )
        content.append(note)
    else:
        content.append(Paragraph("No financial data found for the specified period.", styles['Normal']))
    
    # Build PDF
    doc.build(content)
    buffer.seek(0)
    
    return buffer.getvalue()


def generate_pdf_report(receptions: list, report_info: dict) -> bytes:
    """Generate PDF report from vehicle reception data"""
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    
    # Get styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=30,
        alignment=1,  # Center
    )
    
    # Build content
    content = []
    
    # Header with logo and title
    logo_path = "/app/header.jpg"
    if os.path.exists(logo_path):
        try:
            logo = Image(logo_path, width=431, height=117)
            logo.hAlign = 'CENTER'
            content.append(logo)
            content.append(Spacer(1, 12))
        except:
            pass  # If logo fails to load, continue without it
    
    # Title
    title = Paragraph(f"Petrotreatment Operation Manager<br/>Vehicle Reception Report - {report_info['type'].title()}", title_style)
    content.append(title)
    content.append(Spacer(1, 12))
    
    # Report info
    info_data = [
        ['Report Period:', f"{report_info['start_date'].strftime('%Y-%m-%d')} to {report_info['end_date'].strftime('%Y-%m-%d')}"],
        ['Generated On:', datetime.now().strftime('%Y-%m-%d %H:%M')],
        ['Total Records:', str(len(receptions))],
    ]
    
    if report_info.get('total_vehicles'):
        info_data.append(['Total Vehicles:', str(report_info['total_vehicles'])])
    
    if report_info.get('total_quantity'):
        info_data.append(['Total Quantity:', f"{report_info['total_quantity']:.2f} m³"])
    
    info_table = Table(info_data, colWidths=[2*inch, 3*inch])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), UNICODE_FONT),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    content.append(info_table)
    content.append(Spacer(1, 20))
    
    if receptions:
        # Data table
        table_data = [
            ['Date', 'Company', 'Vehicles', 'Water Type', 'Quantity (m³)', 'Arrival', 'Departure']
        ]
        
        for reception in receptions:
            row = [
                reception.date.strftime('%A, %Y-%m-%d'),  # Include day of week in date format
                clean_text_for_pdf(reception.company_name),
                str(reception.number_of_vehicles),
                clean_text_for_pdf(reception.water_type),
                f"{reception.total_quantity:.2f}",
                reception.arrival_time.strftime('%H:%M') if reception.arrival_time else '-',
                reception.departure_time.strftime('%H:%M') if reception.departure_time else '-'
            ]
            table_data.append(row)
        
        # Create table
        data_table = Table(table_data, repeatRows=1)
        data_table.setStyle(TableStyle([
            # Header row styling
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), UNICODE_FONT_BOLD),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            
            # Data rows styling
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTNAME', (0, 1), (-1, -1), UNICODE_FONT),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('ALIGN', (0, 1), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        content.append(data_table)
    else:
        content.append(Paragraph("No records found for the specified period.", styles['Normal']))
    
    # Build PDF
    doc.build(content)
    buffer.seek(0)
    
    return buffer.getvalue()


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
            company_rate = get_company_rate(company_name)
            cost = volume * company_rate
            total_volume += volume
            total_cost += cost
            
            companies.append({
                'company_name': company_name,
                'total_volume_m3': volume,
                'rate_per_m3': company_rate,
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
    return schemas.CompanyRatesResponse(
        rates=get_all_company_rates(),
        default_rate=DEFAULT_RATE_PER_M3
    )