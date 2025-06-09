import pandas as pd


def safe_to_numeric(series):
    """Safely convert a pandas series to numeric, handling errors gracefully"""
    return pd.to_numeric(series, errors='coerce')


def format_date(date_str):
    """
    Format Flight Date (assuming DDMMMYY input) for AWB data
    """
    try:
        # Attempt parsing known format, be robust to errors
        return pd.to_datetime(date_str, format='%d%b%y', errors='coerce').strftime('%d/%m/%Y')
    except (ValueError, TypeError, AttributeError):
        return date_str # Return original if format is wrong or it's not a string


def format_cca_date(date_str):
    """
    Format CCA Issue Date (assuming DDMMM input) for CCA data
    """
    try:
        # Attempt parsing known format
        return pd.to_datetime(date_str, format='%d%b', errors='coerce').strftime('%d/%b') # Only day/month seems present
    except (ValueError, TypeError, AttributeError):
         return date_str # Return original if format is wrong


def allowed_file(filename, allowed_set):
    """Check if a filename has an allowed extension"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_set 