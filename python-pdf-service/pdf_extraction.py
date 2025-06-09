import re
import pandas as pd
import pdfplumber

def extract_awb_data(pdf):
    """
    Extracts AWB data from specific pages of a FlyDubai PDF invoice 
    by processing the extracted text lines with layout preservation.
    Handles the multi-line format (AWB line + Date/Rate line).
    Dynamically determines the end page based on CCA header.
    """
    print(f"--- Starting AWB PDF Text Extraction Process ---")
    extracted_data = []

    # --- Regex Definitions ---
    # AWB Line (Copied from test_extraction.py - includes optional space before K)
    line1_regex = re.compile(
        r"^\s*141\s+(\d{7})\s+(\d)\s+TLV\s+([A-Z]{3})\s+"  
        r"(\d+\.\d{2}\s*K)\s+"                       # Charge Weight (e.g., 560.00K or 560.00 K) - Made space optional
        r"([\d\.\,-]+)\s+"                             # PP Freight Charge
        r"([\d\.\,-]+)\s+"                             # PP Due Airline
        r"([\d\.\,-]+)\s+"                             # CC Freight Charge
        r"([\d\.\,-]+)\s+"                             # CC Due Agent
        r"([\d\.\,-]+)\s+"                             # CC Due Airline
        r"([\d\.\,-]+)\s+"                             # Disc.
        r"([\d\.\,-]+)\s+"                             # Agency Comm.
        r"([\d\.\,-]+)\s+"                             # Taxes
        r"([\d\.\,-]+)\s+"                             # Others
        r"([\d\.\,-]+)\s+"                             # Net Due for AWB (1)
        r"(1\.00000000)\s+"                           # Exchange Rate
        r"I?\s*([\d\.\,-]+)\s*$"                        # Net Due for AWB (2) - Adjusted slightly based on test script logic
    )
    # Rate pattern (search within the second line)
    net_yield_rate_regex_search = re.compile(r"(\d+\.\d+)")    
    # --- End Regex Definitions ---

    all_lines = []
    
    # --- Determine Target Page Range Dynamically ---
    cca_start_page_index = -1
    num_pages = len(pdf.pages)
    print(f"Total pages in PDF: {num_pages}")
    # Start searching for CCA from page 2 (index 1) onwards
    for page_num in range(1, num_pages):
        try:
            page_to_check = pdf.pages[page_num]
            text_to_check = page_to_check.extract_text()
            if text_to_check and "Section B: CCA Details" in text_to_check:
                cca_start_page_index = page_num
                print(f"  -> Found 'Section B: CCA Details' header on page {page_num + 1}. AWB data ends before this.")
                break
        except Exception as e:
            print(f"Warning: Error checking page {page_num + 1} for CCA header: {e}")

    # If CCA header not found, process all pages from page 2 to the end
    if cca_start_page_index == -1:
        print("  -> 'Section B: CCA Details' not found. Processing AWB data until the end of the document.")
        end_page_index = num_pages
    else:
        end_page_index = cca_start_page_index

    target_pages = range(1, end_page_index) # Page range is 1 to end_page_index (exclusive)
    print(f"AWB Target Page Indices (0-based): {list(target_pages)}")
    # --- End Determine Target Page Range ---

    # --- Extract Text from Target Pages ---
    for page_num in target_pages:
        try:
            page = pdf.pages[page_num]
            print(f"Extracting text with layout from Page {page_num + 1}...")
            # Use same extraction settings as test script
            text = page.extract_text(x_tolerance=2, layout=True) 
            if text:
                page_lines = text.split('\n')
                print(f"  -> Extracted {len(page_lines)} lines from page {page_num + 1}.")
                all_lines.extend(page_lines)
            else:
                print(f"  -> No text extracted from page {page_num + 1}.")
        except Exception as e:
            print(f"Error extracting text from page {page_num + 1}: {e}")
            # Continue to next page if one fails
    # --- End Extract Text ---

    print(f"--- Total text lines collected from AWB pages: {len(all_lines)} ---")

    # --- Process the collected text lines ---
    i = 0
    while i < len(all_lines):
        line1_raw = all_lines[i] 
        line1 = re.sub(r'\s{2,}', ' ', line1_raw).strip() 
        
        match1 = line1_regex.match(line1)
        
        if match1:
            flight_date = ""
            net_yield_rate = ""
            lines_consumed = 1 

            if i + 1 < len(all_lines):
                line2_raw = all_lines[i+1]
                line2 = re.sub(r'\s{2,}', ' ', line2_raw).strip()
                
                parts = line2.split(' ')
                flight_date = "" 
                net_yield_rate = "" 

                if parts:
                     flight_date = parts[0] 
                     lines_consumed += 1

                     rate_match = net_yield_rate_regex_search.search(line2)
                     if rate_match:
                         potential_rates = net_yield_rate_regex_search.findall(line2)
                         if len(potential_rates) > 0:
                             net_yield_rate = potential_rates[0]
                else:
                     flight_date = "" 

            if match1 and flight_date:
                groups = match1.groups()
                # Data cleaning and assignment
                cleaned_groups = [g.replace(',', '.').strip() if isinstance(g, str) else g for g in groups]
                
                awb_number = f"141 {cleaned_groups[0]} {cleaned_groups[1]}"
                destination = cleaned_groups[2]
                charge_weight = cleaned_groups[3] # Already includes K
                pp_freight = cleaned_groups[4]
                pp_due_airline = cleaned_groups[5]
                cc_freight = cleaned_groups[6]
                cc_due_agent = cleaned_groups[7]
                cc_due_airline = cleaned_groups[8]
                disc = cleaned_groups[9]
                agency_comm = cleaned_groups[10]
                taxes = cleaned_groups[11]
                others = cleaned_groups[12]
                net_due_awb1 = cleaned_groups[13]
                exchange_rate = cleaned_groups[14]

                extracted_data.append({
                    "AWB Number": awb_number,
                    "AWB Serial Part1": cleaned_groups[0],
                    "AWB Serial Part2": cleaned_groups[1],
                    "Flight Date": flight_date,
                    "Origin": "TLV",
                    "Destination": destination,
                    "Charge Weight": charge_weight,
                    "Net Yield Rate": net_yield_rate,
                    "PP Freight Charge": pp_freight,
                    "PP Due Airline": pp_due_airline,
                    "CC Freight Charge": cc_freight,
                    "CC Due Agent": cc_due_agent,
                    "CC Due Airline": cc_due_airline,
                    "Disc.": disc,
                    "Agency Comm.": agency_comm,
                    "Taxes": taxes,
                    "Others": others,
                    "Net Due for AWB": net_due_awb1,
                    "Exchange Rate": exchange_rate
                })
                
                i += lines_consumed
                continue 
            else:
                i += 1 
        else:
            i += 1

    print("--- Finished Processing Text Lines ---")
    df = pd.DataFrame(extracted_data)

    return df

def extract_cca_data(pdf):
    """
    Extracts CCA data from page 9 of a FlyDubai PDF invoice
    by processing the extracted text lines with layout preservation.
    Handles the multi-line format for CCA entries.
    Dynamically finds the CCA page.
    """
    print(f"--- Starting CCA PDF Text Extraction Process ---")
    extracted_data = []
    target_page = -1 # Initialize target page index
    raw_text_cca_page = "" # Renamed variable

    # --- Regex Definitions ---
    # Regex to find the Destination and CCA Issue Date on the second line
    destination_regex_search = re.compile(r"\b([A-Z]{3})\b")
    cca_date_regex_search = re.compile(r"\b(\d{2}[A-Z]{3})\b")

    # --- NEW Block Regex --- 
    # Matches the two-line CCA structure within a larger text block
    # Uses re.DOTALL to allow . to match newline characters
    cca_block_regex = re.compile(
        r"^\s*(\d{5,})\s+"          # CCA Ref No (1)
        r"(\d{3})\s*"             # AWB Prefix (2)
        r"(\d{7}\s\d{1})\s*"           # AWB Serial (3) - Captures "NNNNNNN N"
        r"([A-Z]{3})\s+"          # Origin (4)
        r"(\S+)\s+"               # MOP Freight (5)
        r"(\S+)\s+"               # MOP Other (6)
        r"([\d().,-]+)\s+"         # Freight Charge (7) - Handles parentheses
        r"([\d().,-]+)\s+"         # Due Airline (8) - Handles parentheses
        r"([\d().,-]+)\s+"         # Due Agent (9) - Handles parentheses
        r"([\d().,-]+)"            # Disc. (10) - Handles parentheses
        r".*?"                     # Non-greedy match until next numeric field (handles Disc 2nd part, spacing)
        r"([\d().,-]+)\s+"         # Agency Comm. (11) - Handles parentheses
        r"([\d().,-]+)\s+"         # Taxes (12) - Handles parentheses
        r"([\d().,-]+)\s+"         # Others (13) - Handles parentheses
        r"([\d().,-]+)\s+"         # Net Due (Sale) (14) - Handles parentheses
        r"\d\.\d{2}\s+"          # Exchange Rate (ignore)
        r"[\d().,-]+\s*?"          # Net Due (Invoice) (ignore) - Modified to handle parentheses
        # --- Second Line --- 
        r"\n\s*"                  # Match newline and start of next line
        r"(\d{2}[A-Z]{3})?"        # CCA Issue Date (15) - Optional capture
        r".*?"                     # Non-greedy match until destination
        r"\b([A-Z]{3})\b"          # Destination (16)"
        , re.MULTILINE | re.DOTALL # Multiline for ^, Dotall for newline matching
    )
    # --- End Regex Definitions ---

    num_pages = len(pdf.pages)
    print(f"PDF has {num_pages} pages (in CCA function).")
    
    # --- Find the CCA Page Dynamically --- 
    # Start searching after potential AWB pages (e.g., page 2 onwards, index 1)
    start_search_page = 1 
    print(f"Searching for 'Section B: CCA Details' starting from page {start_search_page + 1}...")
    for page_num in range(start_search_page, num_pages):
        print(f"  Checking page {page_num + 1}...")
        try:
            page_to_check = pdf.pages[page_num]
            text_to_check = page_to_check.extract_text()
            if text_to_check and "Section B: CCA Details" in text_to_check:
                target_page = page_num
                print(f"  -> Found CCA header on page {target_page + 1}!")
                break # Stop searching once found
        except Exception as e:
            print(f"Warning: Error checking page {page_num + 1} for CCA header: {e}")
    # --- End Find Page ---

    if target_page != -1: # Check if CCA page was found
        try:
            page = pdf.pages[target_page]
            # --- Use standard extraction --- 
            print(f"Using standard text extraction (no layout=True) for Page {target_page + 1}.")
            raw_text_cca_page = page.extract_text()
            # --- 
            if raw_text_cca_page:
                print(f"  -> Extracted {len(raw_text_cca_page)} characters from page {target_page + 1}.")
            else:
                print(f"  -> No text extracted from page {target_page + 1} using standard extraction.")
        except Exception as e:
             print(f"Error extracting text from CCA page {target_page + 1}: {e}")
             raw_text_cca_page = "" # Ensure it's empty on error
    else:
        print("Warning: 'Section B: CCA Details' header not found in the document. Assuming no CCA data.")
        return pd.DataFrame() # Return empty DF if no CCA page found

    # --- Process using findall on the raw text block --- 
    print("--- Starting CCA processing using findall on raw text --- ")
    extracted_data = [] 
    
    # --- Define clean_currency locally ---
    def clean_currency(value_str):
        if isinstance(value_str, str):
            cleaned = value_str.replace(',', '').strip() # Remove thousand separators if any (CCA unlikely)
            is_negative = False
            
            # Scenario 1: Properly parenthesized e.g., "(123.45)"
            if cleaned.startswith('(') and cleaned.endswith(')'):
                is_negative = True
                cleaned = cleaned[1:-1] # Remove both parentheses
            # Scenario 2: Starts with '(', but no closing ')' from regex e.g., "(123.45"
            elif cleaned.startswith('(') and not cleaned.endswith(')'):
                # Try to strip the opening '(' and see if the rest is a number
                temp_cleaned = cleaned[1:]
                try:
                    # Ensure what remains is a potentially valid number string before float conversion attempt
                    # This regex check is basic, float() will do the final validation
                    if re.match(r"^[\d.]+$", temp_cleaned):
                        is_negative = True
                        cleaned = temp_cleaned # Use the content inside the opening parenthesis
                    # If not a simple number after stripping '(', let it fall through to normal float conversion / error
                except re.error: # In case of bad regex, though unlikely here
                    pass # Fall through

            try:
                value = float(cleaned)
                if is_negative:
                    value = -value
                return value
            except ValueError:
                # If conversion fails, return the cleaned string (or original if cleaning was minimal)
                # This handles cases like "PP", "CC", or unexpected text.
                if not cleaned and value_str == "()": # If original was "()" and now empty
                    return 0.0 # Or handle as None or raise an error based on requirements
                return value_str # Return original if it's not a number like "PP"
        return value_str
    # --- End clean_currency definition ---
    
    if raw_text_cca_page:
        matches = cca_block_regex.findall(raw_text_cca_page)
        print(f"  -> Found {len(matches)} potential CCA blocks using findall.")

        for groups in matches:
            # Check if groups has expected length (adjust based on final regex captures)
            if len(groups) == 16:
                 extracted_data.append({
                    "CCA Ref. No": groups[0],
                    "AWB Prefix": groups[1],
                    "AWB Serial": groups[2].replace(" ", ""), # Remove space from AWB Serial
                    "CCA Issue Date": groups[14] if groups[14] else "", # Extracted from block
                    "Origin": groups[3],
                    "Destination": groups[15], # Extracted from block
                    "MOP Freight Charge": groups[4],
                    "MOP Other Charge": groups[5],
                    "Freight Charge": clean_currency(groups[6]),
                    "Due Airline": clean_currency(groups[7]),
                    "Due Agent": clean_currency(groups[8]),
                    "Disc.": clean_currency(groups[9]),
                    "Agency Comm.": clean_currency(groups[10]),
                    "Taxes": clean_currency(groups[11]),
                    "Others": clean_currency(groups[12]),
                    "Net Due for AWB (Sale Currency)": clean_currency(groups[13]),
                })
            else:
                 print(f"    -> WARNING: Match found but had unexpected number of groups ({len(groups)}). Skipping.")

    else:
        print("  -> No raw text extracted to process.")
    
    print("--- Finished Processing CCA Text ---")
    df_cca = pd.DataFrame(extracted_data)
    
    # Identify numeric columns for potential totaling (excluding AWB parts)
    numeric_cols_cca = [col for col in df_cca.columns if df_cca[col].apply(lambda x: isinstance(x, (int, float))).all()]
    
    # Add Totals Row if data exists and numeric columns are found
    if not df_cca.empty and numeric_cols_cca:
        totals_cca = df_cca[numeric_cols_cca].sum().to_dict()
        totals_row_cca = {col: totals_cca.get(col, '') for col in df_cca.columns}
        # Add a label for the totals row, e.g., in the 'CCA Ref. No' column
        totals_row_cca['CCA Ref. No'] = 'Total' 
        # Ensure AWB details aren't summed
        totals_row_cca['AWB Prefix'] = ''
        totals_row_cca['AWB Serial'] = ''
        totals_row_cca['CCA Issue Date'] = ''
        totals_row_cca['Origin'] = ''
        totals_row_cca['Destination'] = ''
        totals_row_cca['MOP Freight Charge'] = ''
        totals_row_cca['MOP Other Charge'] = ''
        
        df_cca = pd.concat([df_cca, pd.DataFrame([totals_row_cca])], ignore_index=True)
        print("  -> Added totals row to CCA DataFrame.")
    elif not df_cca.empty:
         print("  -> CCA DataFrame created, but no purely numeric columns found for totaling.")
    
    return df_cca 