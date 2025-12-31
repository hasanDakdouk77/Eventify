import "../styles/footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <p>Eventify · Personal Event Planner · {new Date().getFullYear()}</p>
    </footer>
  );
};

export default Footer;
