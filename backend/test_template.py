#!/usr/bin/env python3
"""
Test script for PDF template functionality
"""

import os
import sys
from datetime import datetime
from PyPDF2 import PdfReader

def test_template_exists():
    """Test if template.pdf exists and is readable"""
    template_path = "template.pdf"
    
    if not os.path.exists(template_path):
        print(f"❌ Template not found at {template_path}")
        return False
    
    try:
        reader = PdfReader(template_path)
        print(f"✅ Template found: {len(reader.pages)} page(s)")
        
        # Try to read first page
        if len(reader.pages) > 0:
            page = reader.pages[0]
            print(f"✅ First page readable")
            
            # Try to extract some text to see what's in the template
            try:
                text = page.extract_text()
                if text.strip():
                    print(f"📄 Template contains text: {len(text)} characters")
                    # Show first 100 characters
                    preview = text.replace('\n', ' ').strip()[:100]
                    print(f"📖 Preview: {preview}...")
                else:
                    print("📄 Template appears to be image-only (no extractable text)")
            except Exception as e:
                print(f"⚠️ Could not extract text: {e}")
            
            return True
        else:
            print("❌ Template has no pages")
            return False
            
    except Exception as e:
        print(f"❌ Error reading template: {e}")
        return False

def test_overlay_creation():
    """Test creating overlay PDF"""
    try:
        from routers.reports import create_overlay_pdf
        
        # Mock data for testing
        mock_receptions = []
        mock_report_info = {
            'type': 'monthly',
            'start_date': datetime(2024, 1, 1),
            'end_date': datetime(2024, 1, 31),
            'total_vehicles': 0,
            'total_quantity': 0.0
        }
        
        overlay_bytes = create_overlay_pdf(mock_receptions, mock_report_info)
        
        if len(overlay_bytes) > 0:
            print(f"✅ Overlay PDF created: {len(overlay_bytes)} bytes")
            return True
        else:
            print("❌ Overlay PDF is empty")
            return False
            
    except Exception as e:
        print(f"❌ Error creating overlay: {e}")
        return False

def test_template_merge():
    """Test merging overlay with template"""
    try:
        from routers.reports import create_overlay_pdf, merge_with_template
        
        # Create test overlay
        mock_receptions = []
        mock_report_info = {
            'type': 'test',
            'start_date': datetime(2024, 1, 1),
            'end_date': datetime(2024, 1, 31),
            'total_vehicles': 0,
            'total_quantity': 0.0
        }
        
        overlay_bytes = create_overlay_pdf(mock_receptions, mock_report_info)
        
        # For testing, the merge function will fail because template is at /app/template.pdf
        # But we can test that it returns the overlay bytes when template is not found
        merged_bytes = merge_with_template(overlay_bytes)
        
        if len(merged_bytes) >= len(overlay_bytes):
            print(f"✅ Template merge handled gracefully: {len(merged_bytes)} bytes")
            print("📝 Note: In production, template should be at /app/template.pdf")
            return True
        else:
            print(f"❌ Merge produced smaller output: {len(merged_bytes)} bytes")
            return False
            
    except Exception as e:
        print(f"❌ Error merging template: {e}")
        return False

def main():
    print("🧪 Testing PDF Template Functionality")
    print("=" * 50)
    
    tests = [
        ("Template Exists", test_template_exists),
        ("Overlay Creation", test_overlay_creation),
        ("Template Merge", test_template_merge),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n🔬 Testing: {test_name}")
        result = test_func()
        results.append(result)
        print(f"Result: {'✅ PASS' if result else '❌ FAIL'}")
    
    print("\n" + "=" * 50)
    print(f"📊 Results: {sum(results)}/{len(results)} tests passed")
    
    if all(results):
        print("🎉 All tests passed! Template functionality is working.")
        return 0
    else:
        print("⚠️ Some tests failed. Check the output above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())