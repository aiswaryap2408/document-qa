import requests
import json
from urllib.parse import unquote_plus

def generate_astrology_report(name, gender, dob, tob, pob, mobile, email, chart_style):
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
            
        xml = f"""<DATA><BIRTHDATA><SEX>{sex}</SEX><NAME>{name}</NAME><DAY>{day}</DAY><MONTH>{month}</MONTH><YEAR>{year}</YEAR><TIME24HR>{tob}</TIME24HR><CORR>1</CORR><PLACE>Kochi</PLACE><LONG>076.40</LONG><LAT>09.13</LAT><LONGDIR>E</LONGDIR><LATDIR>N</LATDIR><TZONE>05.30</TZONE><TZONEDIR>E</TZONEDIR></BIRTHDATA><OPTIONS><CHARTSTYLE>{c_style_code}</CHARTSTYLE><CHARTBORDERSTYLE>1</CHARTBORDERSTYLE><VARIANT>V0</VARIANT><LANGUAGE>ENG</LANGUAGE><REPTYPE>CC-AI</REPTYPE><REPFORMAT>HTM</REPFORMAT><CLNTID>CLICKASTRO</CLNTID><ORDID/><HSETTINGS><AYANAMSA>1</AYANAMSA><DASASYSTEM>1</DASASYSTEM><SHOWGULIKAN>1</SHOWGULIKAN><GULIKATYPE>1</GULIKATYPE><PARYANTHARSTART>0</PARYANTHARSTART><PARYANTHAREND>25</PARYANTHAREND><FAVMARPERIOD>50</FAVMARPERIOD><BHAVABALAMETHOD>1</BHAVABALAMETHOD><YEARSPREVDASAPREDREQD>0</YEARSPREVDASAPREDREQD><SUNRISEMETHOD>1</SUNRISEMETHOD><BHAVATYPE>2</BHAVATYPE><ADVANCEDOPTION1>0</ADVANCEDOPTION1><ADVANCEDOPTION2>0</ADVANCEDOPTION2><ADVANCEDOPTION3>0</ADVANCEDOPTION3><ADVANCEDOPTION4>0</ADVANCEDOPTION4></HSETTINGS><EMAIL>{email}</EMAIL></OPTIONS></DATA>"""
        
        # print(f"DEBUG: Generated XML Payload: {xml}")

        # 3. Call API
        url = "https://api.ccrdev.clickastro.com/chat/api.php"
        # We will try sending raw XML body
        # Try form data with key 'xml' (common convention)
        headers = {
            "User-Agent": "Mozilla/5.0", # Avoid bot blocking
        }
        payload = {'xml': xml} 
        
        response = requests.post(
            url,
            data=payload,
            headers=headers,
            timeout=30
        )
        
        # 4. Handle Response
        if response.status_code == 200:
            try:
                json_response = response.json()
                
                # Check for mainHtml and decode it
                if "mainHtml" in json_response:
                    return unquote_plus(json_response["mainHtml"])
                
                return json.dumps(json_response, indent=2)
            except Exception as e:
                # Not JSON?
                raise ValueError(f"API returned non-JSON response. Raw output: {response.text}")
        else:
            raise requests.exceptions.RequestException(f"API Error: {response.status_code} - {response.text}")

    except Exception as e:
        raise RuntimeError(f"Failed to generate report: {e}")
