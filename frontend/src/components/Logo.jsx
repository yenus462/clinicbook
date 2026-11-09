import "./Logo.css";

// The ClinicBook mark and name. light = white text, for dark backgrounds.
function Logo({ light = false, size = 36 }) {
  return (
    <span className={light ? "logo logo-light" : "logo"}>
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
        <rect width="40" height="40" rx="11" fill="#0f4c81" />
        <rect x="17" y="9" width="6" height="22" rx="2" fill="#ffffff" />
        <rect x="9" y="17" width="22" height="6" rx="2" fill="#ffffff" />
        <circle cx="30" cy="10" r="3" fill="#7cc4f5" />
      </svg>
      <span className="logo-text">
        Clinic<span>Book</span>
      </span>
    </span>
  );
}

export default Logo;