import "./SocialButton.css";

export default function SocialButton({ provider, logo, onClick, logoDark, mode = "light" }) {

    if (mode === "dark" && logoDark) {
        logo = logoDark;
    }

    return (
        <button className={`social-btn ${provider}`} onClick={onClick}>
            <img className="social-logo" src={logo} alt={`${provider} logo`} /> Sign in with {provider}
        </button>
    );
}
