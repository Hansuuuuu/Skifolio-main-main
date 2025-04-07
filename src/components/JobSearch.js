import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, Timestamp,addDoc } from "firebase/firestore";
import {serverTimestamp } from "firebase/firestore";
const JobSearch = () => {
    const [jobs, setJobs] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredJobs, setFilteredJobs] = useState([]);
    const [expandedJob, setExpandedJob] = useState(null);
    const [employerDetails, setEmployerDetails] = useState(null);
    const [userAverage, setUserAverage] = useState(null);
    const [appliedJobs, setAppliedJobs] = useState(new Set()); // Track applied jobs
    const [sortOrder, setSortOrder] = useState("ascending");
    const [sortType, setSortType] = useState("date");
  
    useEffect(() => {
      const fetchUserAverageScore = async () => {
        if (auth.currentUser) {
          const userRef = doc(db, "applicants", auth.currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setUserAverage(parseFloat(userSnap.data().skills?.average || 0));
          }
        }
      };
  
      const fetchJobs = async () => {
        const jobsCollection = collection(db, "jobs");
        const jobSnapshot = await getDocs(jobsCollection);
        const jobList = jobSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          averageScore: parseFloat(doc.data().averageScore || 0),
        }));
  
        setJobs(jobList);
        setFilteredJobs(jobList);
      };
  
      fetchUserAverageScore();
      fetchJobs();
      fetchAppliedJobs();
    }, []);
  
    const fetchAppliedJobs = async () => {
      if (auth.currentUser) {
        const userId = auth.currentUser.uid;
        const jobsRef = collection(db, "jobs");
        const jobSnapshot = await getDocs(jobsRef);
        const appliedJobIds = new Set();
  
        for (const jobDoc of jobSnapshot.docs) {
          const applicationsRef = collection(db, "jobs", jobDoc.id, "applications");
          const applicationSnapshot = await getDocs(applicationsRef);
          if (applicationSnapshot.docs.some((doc) => doc.id === userId)) {
            appliedJobIds.add(jobDoc.id);
          }
        }
  
        setAppliedJobs(appliedJobIds);
      }
    };
    const notifyEmployerOfNewApplicant = async (employerUid, jobTitle, applicantName) => {
      const notifRef = collection(db, "employers", employerUid, "notifications");
    
      await addDoc(notifRef, {
        subject: "New Job Application",
        message: `${applicantName} applied for your job posting: ${jobTitle}.`,
        status: "unread",
        timestamp: serverTimestamp(),
      });
    };
    
    useEffect(() => {
      if (expandedJob && expandedJob.employerId) {
        const fetchEmployerDetails = async () => {
          try {
            const employerRef = doc(db, "employers", expandedJob.employerId);
            const employerSnap = await getDoc(employerRef);
            setEmployerDetails(employerSnap.exists() ? employerSnap.data() : null);
          } catch (error) {
            console.error("Error fetching employer details:", error);
            setEmployerDetails(null);
          }
        };
        fetchEmployerDetails();
      } else {
        setEmployerDetails(null);
      }
    }, [expandedJob]);
  
    const handleSearch = (e) => {
      setSearchTerm(e.target.value);
      const filtered = jobs.filter((job) =>
        job.title.toLowerCase().includes(e.target.value.toLowerCase()) ||
        job.description.toLowerCase().includes(e.target.value.toLowerCase())
      );
      setFilteredJobs(filtered);
    };
  
    const handleSort = () => {
      let sortedJobs = [...filteredJobs];
  
      if (sortType === "title") {
        sortedJobs.sort((a, b) =>
          sortOrder === "ascending" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
        );
      } else if (sortType === "date") {
        sortedJobs.sort((a, b) =>
          sortOrder === "ascending" ? new Date(a.postingDate) - new Date(b.postingDate) : new Date(b.postingDate) - new Date(a.postingDate)
        );
      }
  
      setFilteredJobs(sortedJobs);
    };
  
    const highestEligibleJobs = filteredJobs.filter((job) => userAverage !== null && userAverage >= job.averageScore);
  
    const handleApply = async (jobId, jobTitle, e) => {
      e.stopPropagation();
      if (!auth.currentUser) return;
    
      try {
        const userId = auth.currentUser.uid;
        const userRef = doc(db, "applicants", userId);
        const userSnap = await getDoc(userRef);
    
        if (!userSnap.exists()) {
          console.error("User data not found!");
          return;
        }
    
        const userData = userSnap.data();
        const { name, resumeURL, certifications = [], githubLink, email } = userData;
    
        if (!resumeURL) {
          alert("No Resume Applied");
          return;
        }
    
        // Get submissions
        const submissionsRef = collection(db, "applicants", userId, "submissions");
        const submissionSnapshot = await getDocs(submissionsRef);
        const submissions = submissionSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    
        // Apply to job
        const applicationRef = doc(db, "jobs", jobId, "applications", userId);
        const applicationData = {
          userId,
          jobId,
          appliedAt: Timestamp.now(),
          name,
          resumeURL,
          certifications,
          githubLink,
          email,
          submissions,
        };
    
        await setDoc(applicationRef, applicationData);
    
        // 🔍 Step 1: Get the job document to find its companyName
        const jobDoc = await getDoc(doc(db, "jobs", jobId));
        if (!jobDoc.exists()) {
          console.error("Job not found!");
          return;
        }
    
        const jobData = jobDoc.data();
        const companyName = jobData.companyName;
    
        // 🔍 Step 2: Search all employers for matching companyName
        const employersSnapshot = await getDocs(collection(db, "employers"));
        const matchingEmployer = employersSnapshot.docs.find(
          (doc) => doc.data().companyName === companyName
        );
    
        if (matchingEmployer) {
          const employerUid = matchingEmployer.id;
    
          // 📣 Step 3: Notify the employer
          await notifyEmployerOfNewApplicant(employerUid, jobTitle, name);
        } else {
          console.warn("No matching employer found for company:", companyName);
        }
    
        await fetchAppliedJobs(); // Refresh applied jobs
        alert("Applied to job: " + jobTitle);
      } catch (error) {
        console.error("Error applying to job:", error);
      }
    };
    
  
    const handleCancelApplication = async (jobId, e) => {
      e.stopPropagation();
      if (auth.currentUser) {
        try {
          const userId = auth.currentUser.uid;
          const applicationRef = doc(db, "jobs", jobId, "applications", userId);
          await deleteDoc(applicationRef);
  
          await fetchAppliedJobs(); // Refresh applied jobs
  
          alert("Application canceled.");
        } catch (error) {
          console.error("Error canceling application:", error);
        }
      }
    };
  

  return (
    <div style={{ position: "relative" }}>
      <div
        id="job-search-container"
        style={{
          padding: "20px",
        //   filter: expandedJob ? "blur(4px)" : "none", needs fixing
          transition: "filter 0.3s ease-in-out",
        }}
      >
        <h2 style={{ marginTop: "25px" }}>Search Jobs</h2>
        <input
          type="text"
          placeholder="Search for jobs..."
          value={searchTerm}
          onChange={handleSearch}
          style={{
            marginBottom: "20px",
            marginTop: "20px",
            width: "100%",
            padding: "10px",
            borderRadius: "5px",
            border: "1px solid #ddd",
          }}
        />

        <div>
          <button
            onClick={() => {
              setSortOrder((prevOrder) =>
                prevOrder === "ascending" ? "descending" : "ascending"
              );
              handleSort();
            }}
            style={{
              padding: "8px 16px",
              fontSize: "16px",
              backgroundColor: "#007bff",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              marginBottom: "20px",
              marginRight: "10px",
            }}
          >
            Sort by {sortOrder === "ascending" ? "Descending" : "Ascending"}
          </button>

          <select
            onChange={(e) => {
              setSortType(e.target.value);
              handleSort();
            }}
            value={sortType}
            style={{
              padding: "8px 16px",
              fontSize: "16px",
              borderRadius: "5px",
              border: "1px solid #ddd",
              marginBottom: "20px",
              backgroundColor: "#fff",
            }}
          >
            <option value="date">Sort by Date</option>
            <option value="title">Sort by Title</option>
          </select>

          <h3>Highest Eligible Jobs</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
            {highestEligibleJobs.map((job) => (
              <div
                key={job.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  boxShadow: "0 0 10px black",
                  padding: "10px",
                  width: "200px",
                  cursor: "pointer",
                  background: "#a6faf6",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                }}
                onClick={() => setExpandedJob(job)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.boxShadow =
                    "0 0 15px rgba(0, 0, 0, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 0 10px black";
                }}
              >
                <h4>{job.title}</h4>
                <p>
                  <strong>Company:</strong> {job.companyName}
                </p>
                <p>
                  <strong>Location:</strong> {job.location}
                </p>
              </div>
            ))}
          </div>

          <h3>All Jobs</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  boxShadow: "0 0 10px black",
                  padding: "10px",
                  width: "200px",
                  cursor: "pointer",
                  background: "#a6faf6",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                }}
                onClick={() => setExpandedJob(job)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.boxShadow =
                    "0 0 15px rgba(0, 0, 0, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 0 10px black";
                }}
              >
                <h4>{job.title}</h4>
                <p>
                  <strong>Company:</strong> {job.companyName}
                </p>
                <p>
                  <strong>Location:</strong> {job.location}
                </p>
              </div>
            ))}
          </div>
        </div>

        {expandedJob && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "#fff",
            borderRadius: "10px",
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
            width: "80%",
            maxHeight: "80%",
            padding: "20px",
            zIndex: 1000,
            overflowY: "auto",
          }}
        >
          <h3>{expandedJob.title}</h3>
          <p>
            <strong>Company:</strong> {expandedJob.companyName}
          </p>
          <p>{expandedJob.description}</p>

          {employerDetails && (
            <div
              style={{
                marginTop: "20px",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "8px",
              }}
            >
              <h4>Employer Details</h4>
              <p>
                <strong>Phone:</strong> {employerDetails.phone}
              </p>
              <p>
                <strong>Address:</strong> {employerDetails.location}
              </p>
              <p>
                <strong>Email:</strong> {employerDetails.email}
              </p>
              <div>
                <strong>Profile:</strong>
                <br />
                <img
                  src={employerDetails.profilePic || "/default-profile.png"}
                  alt="Employer Profile"
                  style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    marginTop: "10px",
                  }}
                />
              </div>
            </div>
          )}

          {appliedJobs.has(expandedJob.id) ? (
            <button
              onClick={(e) => handleCancelApplication(expandedJob.id, e)}
              style={{
                backgroundColor: "red",
                color: "white",
                padding: "10px",
                marginRight: "10px",
                borderRadius: "5px",
                marginTop: "10px"
              }}
            >
              Cancel Application
            </button>
          ) : (
            <button
              onClick={(e) => handleApply(expandedJob.id, expandedJob.title, e)}
              style={{
                backgroundColor: "#007bff",
                color: "#fff",
                padding: "10px",
                marginRight: "10px",
                borderRadius: "5px",
                marginTop: "10px"
              }}
            >
              Apply
            </button>
          )}

          <button onClick={() => setExpandedJob(null)} style={{ padding: "10px", borderRadius: "5px", marginTop: "10px"  }}>
            Close
          </button>
        </div>
        
      )}
        </div>
    </div>
  );
  
};


export default JobSearch;