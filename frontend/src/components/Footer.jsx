import React, { useState } from "react";
import "./Footer.css";

export default function Footer({
  avatarUrl = "/Dev_Img.jpeg",
  name = "Atharv Gupta",
  branch = "IT (AI & Robotics), 2024-2028",
  email = "mailto:atharvgupta0705@gmail.com",
  github = "https://github.com/atharv-0705",
  linkedin = "https://linkedin.com/in/atharv-gupta",
}) {
  const [imgSrc, setImgSrc] = useState(avatarUrl || "/Dev_Img.jpeg");

  const handleImgError = () => {
    if (imgSrc === "/Dev_Img.jpeg") {
      setImgSrc("/Dev_Img.jpg");
    } else {
      setImgSrc(null);
    }
  };

  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* Left: Circular Avatar & Info */}
        <div className="footer-profile">
          <div className="footer-avatar-ring">
            <div className="footer-avatar-box">
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt={name}
                  className="footer-avatar-img"
                  onError={handleImgError}
                />
              ) : (
                <div className="footer-avatar-fallback">AG</div>
              )}
            </div>
          </div>
          <div className="footer-info">
            <h4 className="footer-name">{name}</h4>
            <p className="footer-branch">{branch}</p>
          </div>
        </div>

        {/* Right: Social Icons */}
        <div className="footer-links">
          {linkedin && (
            <a
              href={linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
              aria-label="LinkedIn"
              title="LinkedIn"
            >
              <svg className="footer-icon fill-icon" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
              </svg>
            </a>
          )}

          {github && (
            <a
              href={github}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
              aria-label="GitHub"
              title="GitHub"
            >
              <svg className="footer-icon fill-icon" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
          )}

          {email && (
            <a
              href={email.startsWith("mailto:") ? email : `mailto:${email}`}
              className="footer-link mail-link"
              aria-label="Email"
              title="Email"
            >
              <svg className="footer-icon stroke-icon-mail" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}


