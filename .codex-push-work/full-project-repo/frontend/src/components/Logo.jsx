import { useNavigate } from "react-router-dom";

export default function Logo() {
  const navigate = useNavigate();

  return (
    <div 
      style={{ display: "flex", alignItems: "center", cursor: "pointer", flexShrink: 0, transition: "transform 0.2s" }} 
      onClick={() => {
        if (window.location.pathname === "/") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          navigate("/");
        }
      }}
      onMouseOver={e => e.currentTarget.style.transform = "scale(1.02)"}
      onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
    >
      <img
        src="https://mc.eduirk.ru/images/headers/imcro2.png"
        alt="МКУ развития образования города Иркутска"
        style={{ height: 48, width: "auto", objectFit: "contain" }}
      />
    </div>
  );
}
