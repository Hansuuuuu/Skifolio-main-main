
import React from "react";
import '../styles.css';

const developers = [
  {
    name: "Ken Robert Noleal",
    role: "Project Lead",
    image: "./images/Noleal.jpg",
  },
  {
    name: "Elay Angel Marie Tandingan",
    role: "System Analyst",
    image: "./images/Tandingan.jpg",
  },
  {
    name: "Cj Napoles",
    role: "Backend Developer",
    image: `./images/Napoles.jpg`,
  },
  {
    name: "Hans Matthew De Guzman",
    role: "Frontend Developer",
    image: "./images/DeGuzman.jpg",
  },
];

const AboutUs = () => {
  return (
    <div className="about-wrapper">
      {/* Header */}
      <header className="top-header">
        <h1 className="site-logo">Ski-Folio</h1>
        <div className="action-btns">
          <a href="/" className="buttonHome">Home</a>
        </div>
      </header>

      {/* System Description */}
      <section className="about-content">
        <h2 className="about-title">About Ski-Folio</h2>
        <p className="about-description">
          Ski-Folio is a personalized job matching and portfolio platform designed to connect applicants with employers in a simple and efficient way. 
          Applicants can showcase their skills, create digital portfolios, and apply for jobs posted by businesses. 
          Meanwhile, employers can post job openings and find ideal candidates that match their needs.
        </p>

        {/* Developer Section */}
        <h3 className="about-title" style={{ marginTop: "50px" }}>Meet the Developers</h3>
        <div className="dev-cards-container">
          {developers.map((dev, index) => (
            <div className="dev-card" key={index}>
              <img src={dev.image} alt={dev.name} className="dev-image" />
              <h3 className="dev-name">{dev.name}</h3>
              <p className="dev-role">{dev.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="homepage-footer">
        Â© {new Date().getFullYear()} Ski-Folio. All rights reserved.
      </footer>
    </div>
  );
};

export default AboutUs;