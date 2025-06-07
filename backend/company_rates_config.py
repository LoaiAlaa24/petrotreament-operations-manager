# Company-specific rates configuration
# Rate per cubic meter (m³) in USD for each company

COMPANY_RATES = {
    "Petronifertiti": 5.50,
    "Unico": 4.75,
    "Nesbco North Sinai": 5.25,
    "Al-Asria Petroleum": 6.00,
    "Sinai Gas": 5.00,
    "Other": 5.00,  # Default rate for other companies
}

# Default rate for companies not in the configuration
DEFAULT_RATE_PER_M3 = 5.00

def get_company_rate(company_name: str) -> float:
    """
    Get the rate per m³ for a specific company.
    
    Args:
        company_name (str): Name of the company
        
    Returns:
        float: Rate per m³ in USD
    """
    return COMPANY_RATES.get(company_name, DEFAULT_RATE_PER_M3)

def get_all_company_rates() -> dict:
    """
    Get all company rates.
    
    Returns:
        dict: Dictionary of company names and their rates
    """
    return COMPANY_RATES.copy()

def update_company_rate(company_name: str, rate: float) -> bool:
    """
    Update the rate for a specific company.
    
    Args:
        company_name (str): Name of the company
        rate (float): New rate per m³
        
    Returns:
        bool: True if updated successfully
    """
    if rate >= 0:
        COMPANY_RATES[company_name] = rate
        return True
    return False