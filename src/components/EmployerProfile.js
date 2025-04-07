import React, { useState, useEffect } from "react";
import { db, auth, storage } from "../firebase";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, deleteDoc,addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onSnapshot } from "firebase/firestore";
import "../styles.css";

const EmployerProfile = () => {
    const [employer, setEmployer] = useState(null);
    const [jobPosts, setJobPosts] = useState([]);
    const [applicants, setApplicants] = useState({});
    const [selectedJob, setSelectedJob] = useState(null);
    const [selectedApplicant, setSelectedApplicant] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [emailSubject, setEmailSubject] = useState("");
    const [emailBody, setEmailBody] = useState("");
    const [editedData, setEditedData] = useState({
        industry: "",
        location: "",
        description: "",
        phone: "",
        contactPerson: "",
    });
    const [profilePic, setProfilePic] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const fetchEmployerData = async () => {
            if (auth.currentUser) {
                const employerRef = doc(db, "employers", auth.currentUser.uid);
                const employerSnap = await getDoc(employerRef);
                if (employerSnap.exists()) {
                    setEmployer(employerSnap.data());
                    setEditedData({
                        industry: employerSnap.data().industry,
                        location: employerSnap.data().location,
                        description: employerSnap.data().description,
                        phone: employerSnap.data().phone,
                        contactPerson: employerSnap.data().contactPerson,
                    });
                    setProfilePic(employerSnap.data().profilePic || "");
                } else {
                    console.log("No employer data found.");
                }
            }
        };

        const fetchJobPosts = async () => {
            if (auth.currentUser) {
                const jobsRef = collection(db, "jobs");
                const q = query(jobsRef, where("employerId", "==", auth.currentUser.uid));
                const querySnapshot = await getDocs(q);
                setJobPosts(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
            }
        };

        fetchEmployerData();
        fetchJobPosts();
    }, []);

    useEffect(() => {
        const unsubscribeMap = {};
    
        jobPosts.forEach((job) => {
            const applicationsRef = collection(db, "jobs", job.id, "applications");
    
            // Listen for real-time changes
            const unsubscribe = onSnapshot(applicationsRef, (snapshot) => {
                const applicantsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    
                setApplicants((prev) => ({
                    ...prev,
                    [job.id]: applicantsData, // Update the job's applicants
                }));
            });
    
            unsubscribeMap[job.id] = unsubscribe;
        });
    
        return () => {
            Object.values(unsubscribeMap).forEach((unsubscribe) => unsubscribe());
        };
    }, [jobPosts]); // Ensure it re-runs when jobPosts change

    const handleJobClick = (job) => {
        setSelectedJob(job.id);
    };
    
    const handleApplicantClick = (applicant) => {
        setSelectedApplicant(applicant);
    };

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleSaveClick = async () => {
        if (auth.currentUser) {
            const employerRef = doc(db, "employers", auth.currentUser.uid);
            await updateDoc(employerRef, editedData);
            setEmployer((prev) => ({ ...prev, ...editedData }));
            setIsEditing(false);
        }
    };

    const handleProfilePicChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setUploading(true);
            const storageRef = ref(storage, `profile_pictures/${auth.currentUser.uid}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            setProfilePic(downloadURL);
            await updateDoc(doc(db, "employers", auth.currentUser.uid), { profilePic: downloadURL });

            setUploading(false);
        }
    };

    const handleDeleteJob = async (jobId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this job post?");
        if (confirmDelete) {
            await deleteDoc(doc(db, "jobs", jobId));
            setJobPosts((prev) => prev.filter((job) => job.id !== jobId));
            alert("Job post deleted successfully!");
        }
    };
    const handleCloseApplicantModal = () => {
        setSelectedApplicant(null);
    };

    const handleChange = (e) => {
        setEditedData({ ...editedData, [e.target.name]: e.target.value });
    };

  const handleEmailSend = async () => {
    if (!selectedApplicant || !selectedJob || !employer) {
        console.error("Missing required data (applicant, job, or employer).");
        return;
    }

    try {
        // Reference to the applicant's notifications subcollection
        const notificationsRef = collection(db, "applicants", selectedApplicant.id, "notifications");

        // Create the notification object with company name, email subject, and email body
        const newNotification = {
            jobId: selectedJob,
            companyName: employer.companyName,  // Include company name
            subject: emailSubject,  // Include email subject
            message: emailBody,  // Include company name, subject, and body
            timestamp: new Date(),
            status: "unread",
        };

        // Add the notification to Firestore
        await addDoc(notificationsRef, newNotification);

        console.log("Notification added successfully!");

        // Send email


        // Show success alert
        alert("Email sent successfully!");

        // Close the applicant submission modal
        setSelectedApplicant(null);
        
    } catch (error) {
        console.error("Error sending email or updating Firestore:", error);
        alert("Failed to send email. Please try again.");
    }
};



    return (
      <div className="employer-profile">
      <h2 style={{marginTop: "50px"}}>Employer Profile</h2>
      {employer ? (
        <div className="profile-details">
          <div className="profile-picture">
            <label htmlFor="profile-pic-upload">
              <img src={profilePic || "/default-profile.png"} alt="Profile" className="profile-pic" />
            </label>
            <input type="file" id="profile-pic-upload" style={{ display: "none" }} onChange={handleProfilePicChange} />
          </div>

          <h3>{employer.companyName}</h3>
          <p><strong>Industry:</strong> {isEditing ? <input type="text" name="industry" value={editedData.industry} onChange={handleChange} /> : employer.industry}</p>
          <p><strong>Location:</strong> {isEditing ? <input type="text" name="location" value={editedData.location} onChange={handleChange} /> : employer.location}</p>
          <p><strong>Description:</strong> {isEditing ? <input type="text" name="description" value={editedData.description} onChange={handleChange} /> : employer.description}</p>

          <h3>Contact Information</h3>
          <p><strong>Name:</strong> {isEditing ? <input type="text" name="contactPerson" value={editedData.contactPerson} onChange={handleChange} /> : employer.contactPerson}</p>
          <p><strong>Email:</strong> {employer.email}</p>
          <p><strong>Phone:</strong> {isEditing ? <input type="text" name="phone" value={editedData.phone} onChange={handleChange} /> : employer.phone}</p>

          {isEditing ? (
            <button className="save-btn" onClick={handleSaveClick}>Save Changes</button>
          ) : (
            <button className="edit-btn" onClick={handleEditClick}>Edit Profile</button>
          )}
                    <h3 style={{marginTop: "10px"}}>Jobs Posted</h3>
                    {jobPosts.length > 0 ? (
                        <ul className="job-list">
                            {jobPosts.map((job) => (
                                <li key={job.id} onClick={() => handleJobClick(job)} className="clickable-job">
                                    <h4>{job.title}</h4>
                                    <p>{job.description}</p>
                                    <p><strong>Location:</strong> {job.location}</p>

                                    {selectedJob === job.id && (
                                        <div id='JOBlist'>
                                            <h5>Applicants:</h5>
                                            <div style={{
                                            maxHeight: '200px',
                                            overflowY: 'auto',
                                            border: '1px solid #ccc',
                                            padding: '10px',
                                            borderRadius: '5px',
                                                                }}
                                         className="applicant-list">
                                                {applicants[job.id] && applicants[job.id].length > 0 ? (
                                            applicants[job.id].map((applicant) => (
                                                <div
                                                    key={applicant.id}
                                                    style={{
                                                        padding: '10px',
                                                        margin: '10px 0',
                                                        backgroundColor: '#f9f9f9',
                                                        cursor: 'pointer',
                                                        borderRadius: '5px',
                                                    }}
                                                    onClick={() => handleApplicantClick(applicant)}
                                                >
                                                    <p><strong>Name:</strong> {applicant.name}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p>No applicants yet.</p>
                                        )}
                                            </div>
                                        </div>
                                    )}
                                    <button id="Delete" onClick={() => handleDeleteJob(job.id)}>Remove</button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No jobs posted yet.</p>
                    )}

                    {/* Applicant Modal */}
                    {selectedApplicant && (
                <div className="modal-overlay1">
                    <div className="modal-content1">
                        <h4>Applicant Details</h4>
                        <p><strong>Name:</strong> {selectedApplicant.name}</p>
                        <p><strong>Email:</strong> {selectedApplicant.email}</p>
                        <p><strong>Resume:</strong>{' '}
                            <a
                                href={selectedApplicant.resumeURL}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {selectedApplicant.resumeURL}
                            </a>
                        </p>

                        <p><strong>Certifications:</strong></p>
                        <div style={{ marginBottom: '20px' }}>
                            {selectedApplicant.certifications && Object.keys(selectedApplicant.certifications).length > 0 ? (
                                Object.entries(selectedApplicant.certifications).map(([skill, certs]) => (
                                    <div key={skill} style={{ marginBottom: '5px' }}>
                                        <strong>{skill}:</strong>
                                        <div>
                                            {certs.map((cert, index) => (
                                                <div key={index}>
                                                    <a href={cert} target="_blank" rel="noopener noreferrer" style={{ color: '#007BFF' }}>
                                                        Certificate {index + 1}
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p>No certifications available</p>
                            )}
                        </div>

                                <p><strong>Submissions:</strong></p>
                                {selectedApplicant.submissions && selectedApplicant.submissions.length > 0 ? (
                                    selectedApplicant.submissions.map((submission, index) => (
                                        <div
                                            key={submission.id}
                                            style={{
                                                marginBottom: '20px',
                                                padding: '10px',
                                                border: '1px solid #ccc',
                                                borderRadius: '5px',
                                            }}
                                        >
                                            <div>
                                                <video width="100%" controls style={{ margin: '10px 0' }}>
                                                    <source src={submission.demoVideoLink} type="video/mp4" />
                                                    Your browser does not support the video tag.
                                                </video>
                                            </div>
                                            <a
                                                href={submission.liveDemoLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ color: '#007BFF', fontWeight: 'bold' }}
                                            >
                                                Live Demo Link: Demo {index + 1}
                                            </a>

                                            <p>CSS Score: {submission.scores?.css || 'N/A'}</p>
                                            <p>HTML Score: {submission.scores?.html || 'N/A'}</p>
                                            <p>JavaScript Score: {submission.scores?.javascript || 'N/A'}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p>No submissions available</p>
                                )}

                            <h4>Send Email to Applicant</h4>
                            <input
                                type="text"
                                placeholder="Email Subject"
                                value={emailSubject}
                                onChange={(e) => setEmailSubject(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    marginBottom: '10px',
                                    borderRadius: '5px',
                                }}
                            />
                                <textarea
                                placeholder="Email Body"
                                value={emailBody}
                                onChange={(e) => setEmailBody(e.target.value)}
                                rows="4"
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '5px',
                                    marginBottom: '10px',
                                }}
                            />
                                <button
                                onClick={handleEmailSend}
                                style={{
                                    padding: '10px 15px',
                                    backgroundColor: '#007BFF',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                }}
                            >
                                Send Email
                            </button>

                            <button
                                onClick={handleCloseApplicantModal}
                                style={{
                                    padding: '10px 15px',
                                    backgroundColor: '#DC3545',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    marginLeft: '10px',
                                }}
                            >
                                Close
                            </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <p>Loading employer details...</p>
            )}
        </div>
    );
};

export default EmployerProfile;