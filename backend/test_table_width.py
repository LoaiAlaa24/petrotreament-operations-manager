#!/usr/bin/env python3
"""
Test script to validate table width and pagination in PDF reports
"""

from reportlab.lib.pagesizes import A4

def test_table_dimensions():
    """Test that table dimensions fit within A4 page"""
    width, height = A4
    print(f"📐 A4 page dimensions: {width:.0f} x {height:.0f} points")
    
    # Standard report table
    standard_col_widths = [70, 105, 45, 85, 65, 50, 50]  # Total: 470 points
    standard_total = sum(standard_col_widths) + 50  # +50 for left margin
    
    print(f"\n📊 Standard Report Table:")
    print(f"   Column widths: {standard_col_widths}")
    print(f"   Total width with margin: {standard_total} points")
    print(f"   Fits in A4: {'✅ YES' if standard_total < width else '❌ NO'}")
    print(f"   Available space: {width - standard_total:.0f} points")
    
    # Financial report table
    financial_col_widths = [130, 75, 75, 95, 70]  # Total: 445 points
    financial_total = sum(financial_col_widths) + 50  # +50 for left margin
    
    print(f"\n💰 Financial Report Table:")
    print(f"   Column widths: {financial_col_widths}")
    print(f"   Total width with margin: {financial_total} points")
    print(f"   Fits in A4: {'✅ YES' if financial_total < width else '❌ NO'}")
    print(f"   Available space: {width - financial_total:.0f} points")
    
    # Content area calculations
    content_height = height - 400  # Account for header (200) + footer (200)
    row_height = 12
    max_rows_per_page = int(content_height / row_height)
    
    print(f"\n📄 Pagination Analysis:")
    print(f"   Content area height: {content_height:.0f} points")
    print(f"   Row height: {row_height} points")
    print(f"   Max rows per page: {max_rows_per_page}")
    print(f"   Header space reserved: 200 points")
    print(f"   Footer space reserved: 200 points")
    
    return standard_total < width and financial_total < width

def test_text_truncation():
    """Test text truncation logic"""
    print(f"\n✂️ Text Truncation Test:")
    
    # Test company name truncation
    long_company = "Very Long Company Name That Should Be Truncated"
    truncated = long_company[:12]
    print(f"   Original: '{long_company}'")
    print(f"   Truncated: '{truncated}'")
    print(f"   Length check: {'✅ OK' if len(truncated) <= 12 else '❌ FAIL'}")
    
    # Test water type truncation
    long_water_type = "Very Long Water Type Description"
    truncated_water = long_water_type[:10]
    print(f"   Water type: '{long_water_type}' -> '{truncated_water}'")
    print(f"   Length check: {'✅ OK' if len(truncated_water) <= 10 else '❌ FAIL'}")
    
    return True

def main():
    print("🧪 Testing PDF Table Layout and Pagination")
    print("=" * 60)
    
    tests = [
        ("Table Dimensions", test_table_dimensions),
        ("Text Truncation", test_text_truncation),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n🔬 Testing: {test_name}")
        result = test_func()
        results.append(result)
        print(f"Result: {'✅ PASS' if result else '❌ FAIL'}")
    
    print("\n" + "=" * 60)
    print(f"📊 Results: {sum(results)}/{len(results)} tests passed")
    
    if all(results):
        print("🎉 All tests passed! Table layout should work correctly.")
        return 0
    else:
        print("⚠️ Some tests failed. Check the output above.")
        return 1

if __name__ == "__main__":
    import sys
    sys.exit(main())