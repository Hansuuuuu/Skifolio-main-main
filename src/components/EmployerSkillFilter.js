import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const skillOptions = [
  "Front-end Developer", "Back-end Developer", "Full Stack Developer",
  "React Developer", "Vue.js Developer", "Angular Developer",
  "Node.js Developer", "Django Developer", "Laravel Developer",
  "Express.js Developer", "JavaScript Engineer", "TypeScript Developer",
  "Next.js Developer", "Nuxt.js Developer", "API Developer"
];

const EmployerSkillFilter = () => {
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [filteredApplicants, setFilteredApplicants] = useState([]);
  const [selectedApplicant, setSelectedApplicant] = useState(null);

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  useEffect(() => {
    const fetchApplicants = async () => {
      const snapshot = await getDocs(collection(db, "applicants"));
      let filtered = [];
  
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.scoutVisibility) return;
  
        const match = selectedSkills.every((skill) => data.skills?.[skill]);
        if (match) {
          filtered.push({ id: doc.id, ...data });
        }
      });
  
      // Sort by average descending, but only if the field exists and is a number
      filtered.sort((a, b) => parseFloat(b.average || 0) - parseFloat(a.average || 0));
  
      setFilteredApplicants(filtered);
    };
  
    if (selectedSkills.length > 0) {
      fetchApplicants();
    } else {
      setFilteredApplicants([]);
    }
  }, [selectedSkills]);
  
  

  return (
    <div style={{ padding: "100px", maxWidth: "1000px", margin: "auto" }}>
      <h2 style={{ textAlign: "center" }}>Filter Applicants by Skills</h2>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "10px",
        marginBottom: "30px"
      }}>
        {skillOptions.map((skill) => (
          <div
            key={skill}
            onClick={() => toggleSkill(skill)}
            style={{
              padding: "12px",
              border: "2px solid #ccc",
              borderRadius: "8px",
              cursor: "pointer",
              backgroundColor: selectedSkills.includes(skill) ? "#4ad4d4" : "#fff",
              fontWeight: "600",
              textAlign: "center"
            }}
          >
            {skill}
          </div>
        ))}
      </div>

      <h3>Matching Applicants: {filteredApplicants.length}</h3>
      <div style={{ display: "grid", gap: "15px" }}>
        {filteredApplicants.map((applicant) => (
          <div
            key={applicant.id}
            onClick={() => setSelectedApplicant(applicant)}
            style={{
              border: "1px solid #ddd",
              padding: "20px",
              borderRadius: "10px",
              backgroundColor: "#f9f9f9",
              cursor: "pointer"
            }}
          >
            <p><strong>{applicant.name}</strong> — {applicant.experience}</p>
            <p>{Object.keys(applicant.skills || {}).join(", ")}</p>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {selectedApplicant && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <div style={{
            backgroundColor: "#fff",
            padding: "30px",
            borderRadius: "10px",
            maxWidth: "800px",
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto"
          }}>
            <button onClick={() => setSelectedApplicant(null)} style={{ float: "right", fontSize: "20px" }}>✖</button>
            <div style={{ display: "flex", gap: "20px", marginTop: "10px" }}>
              <img src={selectedApplicant.profilePicURL} alt="Profile" style={{ width: "120px", borderRadius: "10px" }} />
              <div>
                <h2>{selectedApplicant.name}</h2>
                <p><strong>Email:</strong> {selectedApplicant.email}</p>
                <p><strong>Experience:</strong> {selectedApplicant.experience}</p>
                <p><strong>GitHub:</strong> <a href={selectedApplicant.githubLink} target="_blank" rel="noreferrer">{selectedApplicant.githubLink}</a></p>
                <p><strong>Resume:</strong> <a href={selectedApplicant.resumeURL} target="_blank" rel="noreferrer">View PDF</a></p>
              </div>
            </div>

            <div style={{ marginTop: "20px" }}>
              <h3>Skills</h3>
              <ul>
              {Object.keys(selectedApplicant.skills || {})
                .filter(skill => !["average", "html", "css", "javascript"].includes(skill.toLowerCase()))
                .map((skill) => (
                    <li key={skill}>{skill}</li>
                ))}

              </ul>
            </div>

            <div style={{ marginTop: "20px" }}>
              <h3>Certifications</h3>
              {selectedApplicant.certifications && Object.entries(selectedApplicant.certifications).map(([category, urls]) => (
                <div key={category} style={{ marginBottom: "10px" }}>
                  <h4>{category}</h4>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {urls.map((url, i) => (
                      <img key={i} src={url} alt="cert" style={{ width: "150px", borderRadius: "8px" }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerSkillFilter;