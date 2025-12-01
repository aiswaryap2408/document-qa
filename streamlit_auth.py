import streamlit as st
import hashlib
import os

def hash_password(password: str) -> str:
    """Simple password hashing."""
    return hashlib.sha256(password.encode()).hexdigest()

def require_auth():
    """
    Enforce authentication using Streamlit's session state.
    Works both locally and on Streamlit Cloud.
    """
    # Check if user is already authenticated
    if "user_email" in st.session_state and st.session_state.get("authenticated"):
        return True
    
    # Show login form
    st.title("🔒 Authentication Required")
    
    tab1, tab2 = st.tabs(["Sign In", "Sign Up"])
    
    with tab1:
        with st.form("signin_form"):
            email = st.text_input("Email")
            password = st.text_input("Password", type="password")
            submit = st.form_submit_button("Sign In")
            
            if submit:
                if authenticate_user(email, password):
                    st.session_state["user_email"] = email
                    st.session_state["authenticated"] = True
                    st.success("Login successful!")
                    st.rerun()
                else:
                    st.error("Invalid credentials")
    
    with tab2:
        with st.form("signup_form"):
            new_email = st.text_input("Email")
            new_password = st.text_input("Password", type="password")
            confirm_password = st.text_input("Confirm Password", type="password")
            signup = st.form_submit_button("Sign Up")
            
            if signup:
                if new_password != confirm_password:
                    st.error("Passwords don't match")
                elif len(new_password) < 6:
                    st.error("Password must be at least 6 characters")
                else:
                    try:
                        create_user(new_email, new_password)
                        st.success("Account created! Please sign in.")
                    except ValueError as e:
                        st.error(str(e))
    
    st.stop()
    return False

def authenticate_user(email: str, password: str) -> bool:
    """Authenticate user against MongoDB."""
    try:
        from auth_pages.auth import authenticate_user as mongo_auth
        return mongo_auth(email, password)
    except Exception as e:
        st.error(f"Authentication error: {e}")
        return False

def create_user(email: str, password: str):
    """Create a new user in MongoDB."""
    from auth_pages.auth import create_user as mongo_create
    mongo_create(email, password)

def add_logout_button():
    """Add a logout button to the sidebar."""
    if "user_email" in st.session_state:
        st.sidebar.success(f"Logged in as: {st.session_state['user_email']}")
        if st.sidebar.button("Logout"):
            st.session_state.clear()
            st.rerun()
