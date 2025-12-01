import streamlit as st
import hashlib

def hash_password(password: str) -> str:
    """Hash password using SHA256."""
    return hashlib.sha256(password.encode()).hexdigest()

def require_auth():
    """
    Simple authentication for single-user app.
    Uses password from Streamlit secrets or environment.
    """
    # Check if already authenticated
    if st.session_state.get("authenticated"):
        return True
    
    # Get password from secrets (cloud) or use default (local)
    try:
        # Try Streamlit secrets first (for cloud deployment)
        if "APP_PASSWORD" in st.secrets:
            correct_password_hash = st.secrets["APP_PASSWORD"]
        else:
            # Fallback for local development
            # Default password: "admin123" (change this!)
            correct_password_hash = hash_password("admin123")
    except:
        # If no secrets file, use default
        correct_password_hash = hash_password("admin123")
    
    # Show login form
    st.title("🔒 Authentication Required")
    # st.info("💡 **Local development**: Default password is `admin123`")
    
    with st.form("login_form"):
        password = st.text_input("Password", type="password")
        submit = st.form_submit_button("Sign In")
        
        if submit:
            if hash_password(password) == correct_password_hash:
                st.session_state["authenticated"] = True
                st.session_state["user_email"] = "user@app.local"
                st.success("Login successful!")
                st.rerun()
            else:
                st.error("Invalid password")
    
    st.markdown("---")
    # st.caption("**For deployment**: Set `APP_PASSWORD` in Streamlit secrets to your hashed password.")
    # st.caption(f"**Generate hash**: Run `python -c \"import hashlib; print(hashlib.sha256(b'YourPassword').hexdigest())\"`")
    
    st.stop()
    return False

def add_logout_button():
    """Add a logout button to the sidebar."""
    if st.session_state.get("authenticated"):
        st.sidebar.success("🔓 Authenticated")
        if st.sidebar.button("Logout"):
            st.session_state.clear()
            st.rerun()
