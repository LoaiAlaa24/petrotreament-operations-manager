# Company-specific rates configuration
# Rate per cubic meter (m³) with support for different waste types and currencies

COMPANY_RATES = [
    # بترونيفرتيتي - type-specific pricing matching exact waterTypes
    {"name": "بترونيفرتيتي", "type": "زيوت (OBM)", "price_usd": 54},
    {"name": "بترونيفرتيتي", "type": "طافلة (WBM)", "price_usd": 45},
    {"name": "بترونيفرتيتي", "type": "مياه ملوثة بالزيت", "price_usd": 15},
    {"name": "بترونيفرتيتي", "type": "مياه ملوثة", "price_usd": 13},
    
    # Other companies - single rate per company
    {"name": "MK - يونيكو", "price_egp": 63.5},
    {"name": "يونيكو - قنطرة", "price_egp": 189.70},
    {"name": "ابسكو", "price_egp": 1},
    {"name": "عامر جروب (بورتوسعيد)", "price_egp": 117},
    {"name": "نسبكو (شمال سيناء للبترول)", "price_usd": 1},
    {"name": "شيلف ضرلينج", "price_usd": 1},
    {"name": "أخرى", "price_usd": 1}
]

# English company name mappings for the same rates
ENGLISH_COMPANY_MAPPING = {
    "Petronifertiti": "بترونيفرتيتي",
    "MK - Unico": "MK - يونيكو",
    "Unico - Qantara": "يونيكو - قنطرة",
    "Apsco": "ابسكو",
    "Amer Group (Port Said)": "عامر جروب (بورتوسعيد)",
    "Nesbco (North Sinai Petroleum)": "نسبكو (شمال سيناء للبترول)",
    "Shelf Drilling": "شيلف ضرلينج",
    "Other": "أخرى"
}

# Default rate for companies not in the configuration
DEFAULT_RATE_USD = 1.0
DEFAULT_RATE_EGP = 30.0

def get_company_rate(company_name: str, waste_type: str = None) -> dict:
    """
    Get the rate per m³ for a specific company and waste type.
    
    Args:
        company_name (str): Name of the company (Arabic or English)
        waste_type (str): Type of waste (optional)
        
    Returns:
        dict: Rate information with currency and amount
    """
    # Convert English company name to Arabic if needed
    arabic_name = ENGLISH_COMPANY_MAPPING.get(company_name, company_name)
    
    # Find matching rates
    matching_rates = [rate for rate in COMPANY_RATES if rate["name"] == arabic_name]
    
    if not matching_rates:
        return {"currency": "USD", "rate": DEFAULT_RATE_USD}
    
    # If waste type is specified and company has type-specific rates
    if waste_type:
        type_specific_rate = next((rate for rate in matching_rates if rate.get("type") == waste_type), None)
        if type_specific_rate:
            if "price_usd" in type_specific_rate:
                return {"currency": "USD", "rate": type_specific_rate["price_usd"]}
            elif "price_egp" in type_specific_rate:
                return {"currency": "EGP", "rate": type_specific_rate["price_egp"]}
    
    # Return the first available rate for the company
    first_rate = matching_rates[0]
    if "price_usd" in first_rate:
        return {"currency": "USD", "rate": first_rate["price_usd"]}
    elif "price_egp" in first_rate:
        return {"currency": "EGP", "rate": first_rate["price_egp"]}
    
    return {"currency": "USD", "rate": DEFAULT_RATE_USD}

def get_all_company_rates() -> list:
    """
    Get all company rates.
    
    Returns:
        list: List of all company rate configurations
    """
    return COMPANY_RATES.copy()

def get_company_rate_options(company_name: str) -> list:
    """
    Get all rate options for a specific company.
    
    Args:
        company_name (str): Name of the company
        
    Returns:
        list: List of rate options for the company
    """
    arabic_name = ENGLISH_COMPANY_MAPPING.get(company_name, company_name)
    return [rate for rate in COMPANY_RATES if rate["name"] == arabic_name]

def update_company_rate(company_name: str, rate_data: dict) -> bool:
    """
    Update or add a rate for a specific company.
    
    Args:
        company_name (str): Name of the company
        rate_data (dict): Rate configuration
        
    Returns:
        bool: True if updated successfully
    """
    try:
        # Remove existing rate if updating
        global COMPANY_RATES
        COMPANY_RATES = [rate for rate in COMPANY_RATES 
                        if not (rate["name"] == company_name and 
                               rate.get("type") == rate_data.get("type"))]
        
        # Add new rate
        COMPANY_RATES.append(rate_data)
        return True
    except Exception:
        return False