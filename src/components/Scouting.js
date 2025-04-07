import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import "../styles.css";

const jobOptions = [
  "Front-end Developer", "Back-end Developer", "Full Stack Developer",
  "React Developer", "Vue.js Developer", "Angular Developer",
  "Node.js Developer", "Django Developer", "Laravel Developer",
  "Express.js Developer", "JavaScript Engineer", "TypeScript Developer",
  "Next.js Developer", "Nuxt.js Developer", "API Developer"
];

const Scouting = () => {
  const [scoutVisibility, setScoutVisibility] = useState(false);
  const [experience, setExperience] = useState("");
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [skills, setSkills] = useState({});


  useEffect(() => {
    const fetchScoutingStatus = async () => {
      if (!auth.currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, "applicants", auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setScoutVisibility(data.scoutVisibility || false);
          setExperience(data.experience || "");
          setSkills(data.skills || {});
        }
      } catch (error) {
        console.error("Error fetching scouting status:", error);
      }
    };
    fetchScoutingStatus();
  }, []);
  

  const toggleScoutVisibility = async () => {
    const newVisibility = !scoutVisibility;
    setScoutVisibility(newVisibility);
    try {
      await updateDoc(doc(db, "applicants", auth.currentUser.uid), { scoutVisibility: newVisibility });
    } catch (error) {
      console.error("Error updating scout visibility:", error);
    }
  };

  const handleExperienceChange = async (value) => {
    setExperience(value);
    try {
      await updateDoc(doc(db, "applicants", auth.currentUser.uid), { experience: value });
    } catch (error) {
      console.error("Error updating experience:", error);
    }
  };

  const toggleSkillSelection = async (job) => {
    const updatedSkills = { ...skills };
  
    if (updatedSkills[job]) {
      delete updatedSkills[job]; // Uncheck
    } else {
      updatedSkills[job] = true; // Check
    }
  
    setSkills(updatedSkills);
  
    try {
      await updateDoc(doc(db, "applicants", auth.currentUser.uid), { skills: updatedSkills });
    } catch (error) {
      console.error("Error updating skills:", error);
    }
  };
  

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2 style={{ color: "#333" }}>Scouting Visibility</h2>
      <div className="toggle-container" style={{ marginBottom: "20px" }}>
        <label className="switch" style={{ position: "relative", display: "inline-block", width: "60px", height: "34px" }}>
          <input type="checkbox" checked={scoutVisibility} onChange={toggleScoutVisibility} style={{ opacity: 0, width: 0, height: 0 }} />
          <span className="slider round" style={{ position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: scoutVisibility ? "#4ad4d4" : "#ccc", borderRadius: "34px", transition: ".4s" }}></span>
        </label>
        <p style={{ fontSize: "18px", fontWeight: "600", color: scoutVisibility ? "#4ad4d4" : "#666", marginTop: "10px" }}>
          {scoutVisibility ? "You are visible to employers." : "You are hidden from employers."}
        </p>
      </div>
      
      {scoutVisibility && (
        <div style={{ maxWidth: "700px", margin: "auto", background: "#ffffff", padding: "30px", borderRadius: "12px", boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.2)" }}>
          <h3 style={{ marginBottom: "15px", color: "#333" }}>Experience Level</h3>
          <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "25px" }}>
            <button
              className="experience-btn"
              onClick={() => handleExperienceChange("No experience")}
              style={{ padding: "12px 30px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "16px", fontWeight: "600", background: experience === "No experience" ? "#4ad4d4" : "#eee", transition: "0.3s" }}
            >
              No Experience
            </button>
            <button
              className="experience-btn"
              onClick={() => handleExperienceChange("Have job experience")}
              style={{ padding: "12px 30px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "16px", fontWeight: "600", background: experience === "Have job experience" ? "#4ad4d4" : "#eee", transition: "0.3s" }}
            >
              Have Job Experience
            </button>
          </div>

          <h3 style={{ marginBottom: "15px", color: "#333" }}>Preferred Job Roles</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          {jobOptions.map((job) => (
            <div
              key={job}
              onClick={() => toggleSkillSelection(job)}
              style={{
                padding: "14px",
                border: "2px solid #ccc",
                borderRadius: "10px",
                cursor: "pointer",
                background: skills[job] ? "#4ad4d4" : "#fff",
                fontWeight: "600",
                textAlign: "center",
                transition: "0.3s",
                boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)"
              }}
            >
              {job}
            </div>
          ))}

          </div>
        </div>
      )}
    </div>
  );
};

export default Scouting;