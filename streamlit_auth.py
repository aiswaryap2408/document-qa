import streamlit as st
import requests

FLASK_AUTH_URL = "http://localhost:5000/verify_token"

def require_auth():
    """
    Enforce authentication. 
    If not authenticated, show a warning and stop execution.
    """
    # Check if user is already authenticated in session
    if "user_email" in st.session_state:
        return True

    # Check for token in query params
    # st.query_params is the new way, fallback for older versions if needed
    query_params = st.query_params
    token = query_params.get("token")

    if token:
        try:
            response = requests.get(f"{FLASK_AUTH_URL}?token={token}")
            if response.status_code == 200:
                data = response.json()
                if data.get("valid"):
                    st.session_state["user_email"] = data["email"]
                    return True
        except Exception as e:
            st.error(f"Auth Error: {e}")
    
    # If we get here, not authenticated
    st.title("🔒 Authentication Required")
    st.warning("You must sign in to access this application.")
    st.markdown(f"[👉 Click here to Sign In](http://localhost:5000/signin)", unsafe_allow_html=True)
    st.stop()
    return False

def add_logout_button():
    """Add a logout button to the sidebar."""
    if "user_email" in st.session_state:
        st.sidebar.success(f"Logged in as: {st.session_state['user_email']}")
        if st.sidebar.button("Logout"):
            del st.session_state["user_email"]
            st.query_params.clear()
            st.rerun()
