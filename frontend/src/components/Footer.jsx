import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>🏙 Urban Issue Reporter</h3>
            <p>Making cities better, together.</p>
          </div>
          
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/report">Report Issue</a></li>
              <li><a href="/map">View Map</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Contact</h4>
            <p>📧 support@urbanissues.com</p>
            <p>📞 +1 (555) 123-4567</p>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 Urban Issue Reporter. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
