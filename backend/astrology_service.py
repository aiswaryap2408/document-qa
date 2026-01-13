import requests
import json
import time
from urllib.parse import unquote_plus

def generate_astrology_report(name, gender, dob, tob, pob, mobile, email, chart_style, place, longdeg, longmin, longdir, latdeg, latmin, latdir, timezone):
    """
    Call ClickAstro API to generate report.
    Returns the HTML report content (string) or JSON string.
    """
    try:
        print(f"DEBUG: Generating report for: {name}, {gender}, {dob}, {tob}, {pob}, {mobile}, {email}, {chart_style}")
        # 1. Prepare Data
        year, month, day = dob.split("-")
        
        # Gender mapping
        sex = gender if gender in ["Male", "Female"] else "Male" # Default fallback 

        # Chart Style Mapping
        # As per user request: Kerala=0, South=1, North=2, East=3
        style_map = {
            "Kerala": 0,
            "South Indian": 1,
            "North Indian": 2,
            "East Indian": 3
        }
        c_style_code = style_map.get(chart_style, 0) 

        # 2. Construct XML
        # Ensure time is HH.MM.SS (using dots as per user sample)
        if len(tob) == 5:
            tob = f"{tob}:00"
        tob = tob.replace(":", ".")

        if len(timezone) == 5:
            timezone = f"{timezone}:00"
        
        # Extract timezone direction (last character if it's an alphabet)
        timezone_dir = 'E'  # Default
        if timezone and timezone[-1].isalpha():
            timezone_dir = timezone[-1].upper()
            timezone = timezone[:-1]
        
        # Extract longitude and latitude directions
        long_dir = longdir.upper() if longdir else 'E'
        lat_dir = latdir.upper() if latdir else 'N'
        
        # Format longitude and latitude degrees with leading zeros
        longdeg_formatted = str(longdeg).zfill(3)  # 3 digits for longitude
        latdeg_formatted = str(latdeg).zfill(2)    # 2 digits for latitude
            
        xml = f"""<DATA><BIRTHDATA><SEX>{sex}</SEX><NAME>{name}</NAME><DAY>{day}</DAY><MONTH>{month}</MONTH><YEAR>{year}</YEAR><TIME24HR>{tob}</TIME24HR><CORR>1</CORR><PLACE>{place}</PLACE><LONG>{longdeg_formatted}.{longmin}</LONG><LAT>{latdeg_formatted}.{latmin}</LAT><LONGDIR>{long_dir}</LONGDIR><LATDIR>{lat_dir}</LATDIR><TZONE>{timezone}</TZONE><TZONEDIR>{timezone_dir}</TZONEDIR></BIRTHDATA><OPTIONS><CHARTSTYLE>{c_style_code}</CHARTSTYLE><CHARTBORDERSTYLE>1</CHARTBORDERSTYLE><VARIANT>V0</VARIANT><LANGUAGE>ENG</LANGUAGE><REPTYPE>CC-AI</REPTYPE><REPFORMAT>HTM</REPFORMAT><CLNTID>CLICKASTRO</CLNTID><ORDID/><HSETTINGS><AYANAMSA>1</AYANAMSA><DASASYSTEM>1</DASASYSTEM><SHOWGULIKAN>1</SHOWGULIKAN><GULIKATYPE>1</GULIKATYPE><PARYANTHARSTART>0</PARYANTHARSTART><PARYANTHAREND>25</PARYANTHAREND><FAVMARPERIOD>50</FAVMARPERIOD><BHAVABALAMETHOD>1</BHAVABALAMETHOD><YEARSPREVDASAPREDREQD>0</YEARSPREVDASAPREDREQD><SUNRISEMETHOD>1</SUNRISEMETHOD><BHAVATYPE>2</BHAVATYPE><ADVANCEDOPTION1>0</ADVANCEDOPTION1><ADVANCEDOPTION2>0</ADVANCEDOPTION2><ADVANCEDOPTION3>0</ADVANCEDOPTION3><ADVANCEDOPTION4>0</ADVANCEDOPTION4></HSETTINGS><EMAIL>{email}</EMAIL></OPTIONS></DATA>"""
        

        # 3. Call API with retries
        url = "https://api.ccrdev.clickastro.com/chat/api.php"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "Accept-Language": "en-US,en;q=0.9",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "Origin": "https://api.ccrdev.clickastro.com",
            "Referer": "https://api.ccrdev.clickastro.com/chat/",
            "X-Requested-With": "XMLHttpRequest"
        }
        payload = {'xml': xml} 
        
        max_retries = 3
        last_error = None
        
        for attempt in range(max_retries):
            try:
                print(f"DEBUG: [BACKGROUND] Calling ClickAstro API (Attempt {attempt+1}/{max_retries})...")
                response = requests.post(
                    url,
                    data=payload,
                    headers=headers,
                    timeout=60 # Increased timeout
                )
                
                # 4. Handle Response
                if response.status_code == 200:
                    try:
                        json_response = response.json()
                        print(f"DEBUG: [BACKGROUND] ClickAstro API Response keys: {list(json_response.keys())}")
                        
                        # Check for mainHtml and decode it
                        if "mainHtml" in json_response:
                            content = unquote_plus(json_response["mainHtml"])
                            print(f"DEBUG: [BACKGROUND] mainHtml length: {len(content)}")
                            return content
                        
                        print("DEBUG: [BACKGROUND] mainHtml not found in response.")
                        return json.dumps(json_response, indent=2)
                    except Exception as e:
                        # Not JSON?
                        raise ValueError(f"API returned non-JSON response. Raw output: {response.text}")
                else:
                    last_error = f"API Error: {response.status_code} - {response.text}"
                    print(f"DEBUG: [BACKGROUND] ClickAstro API Attempt {attempt+1} failed: {last_error}")
            except (requests.exceptions.RequestException, ValueError) as e:
                last_error = str(e)
                print(f"DEBUG: [BACKGROUND] ClickAstro API Attempt {attempt+1} failed: {last_error}")
            
            # Wait before retry (except for last attempt)
            if attempt < max_retries - 1:
                time.sleep(2 * (attempt + 1)) # Simple backoff
        
    except Exception as e:
        raise RuntimeError(f"Failed to generate report: {e}")


def send_sms_otp(mobile: str, otp: str):
    """
    Send OTP via sapteleservices.in SMS API.
    Based on USER provided PHP logic.
    """
    try:
        import os
        url = "http://sapteleservices.in/SMS_API/sendsms.php"
        username = os.getenv("SMS_USERNAME", "clickastro")
        password = os.getenv("SMS_PASSWORD", "7f4f17")
        sender_id = os.getenv("SMS_SENDER_ID", "FNDAST")
        tmpl_id = os.getenv("SMS_TEMPLATE_ID", "1207164457444465264")
        
        # Message must exactly match the template registered with the DLT
        # Template: {otp}is your one-time password for FindAstro. It is valid for 10 minutes. Do not share your OTP with anyone. \r\n\r\n7UmkJ0YKruC
        message = f"{otp}is your one-time password for FindAstro. It is valid for 10 minutes. Do not share your OTP with anyone. \r\n\r\n7UmkJ0YKruC"
        
        params = {
            "username": username,
            "password": password,
            "mobile": mobile,
            "sendername": sender_id,
            "message": message,
            "routetype": 1, # Transactional
            "tid": tmpl_id,
        }
        import urllib.parse
        query_string = urllib.parse.urlencode(params, quote_via=urllib.parse.quote_plus)
        full_url = f"{url}?{query_string}"
        
        print(f"DEBUG: Requesting SMS URL: {full_url}")
        response = requests.get(full_url, timeout=5)
        
        if response.status_code == 200:
            print(f"DEBUG: SMS API Success Response: {response.text}")
            return True
        else:
            print(f"ERROR: SMS API Failure Response ({response.status_code}): {response.text}")
            return False
            
    except Exception as e:
        print(f"ERROR in send_sms_otp: {str(e)}")
        return False
