import React, { useState, useEffect } from "react";
import { db, storage } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  deleteDoc,
  doc,
  addDoc,
} from "firebase/firestore";
import { setDoc} from "firebase/firestore";
const AdminPage = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isApplicant, setIsApplicant] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [employers, setEmployers] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedUserType, setSelectedUserType] = useState("Applicants");
  const [selectedUser, setSelectedUser] = useState(null);
  const [employerJobs, setEmployerJobs] = useState([]);
  const [jobApplicants, setJobApplicants] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [pendingJobs, setPendingJobs] = useState([]);
  const [isUserClassVisible, setIsUserClassVisible] = useState(true)
  const [isUserApproval, setUserApproval] = useState(true)
  const [historyVisible, setHistoryVisible] = useState(true);
  const [historyData, setHistoryData] = useState([]);
  const [sendNotif, setSendNotification] =  useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [recipientType, setRecipientType] = useState(null);
  const [imageFile, setImageFile] = useState(null); // Define the state for the image file


  // const [announcements, setAnnouncements] = useState([]);
  // const [newAnnouncement, setNewAnnouncement] = useState('');
    const [activeTab, setActiveTab] = useState('manageUsers');


  // Function to add history record with a timestamp
  const addHistoryRecord = async (event, details) => {
    const timestamp = new Date().toISOString(); // Get current timestamp
    setHistoryData((prevHistory) => [
      ...prevHistory,
      { timestamp, event, details },
    ]);


    try {
      // Add the new record to Firestore
      const historyDocRef = await addDoc(collection(db, "historyData"), {
        timestamp,
        event,
        details,
      });
    } catch (error) {
      console.error("Error adding history record: ", error);
    }
  };
  
  // Fetch applicants and employers from Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Fetch applicants
        const applicantsSnapshot = await getDocs(collection(db, "applicants"));
        const applicantsData = applicantsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));


        // Fetch employers
        const employersSnapshot = await getDocs(collection(db, "employers"));
        const employersData = employersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));


        setApplicants(applicantsData);
        setEmployers(employersData);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };


    fetchUsers();
  }, []);


  // Fetch Applicants
  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        const applicantsSnapshot = await getDocs(collection(db, "applicants"));
        const applicantsData = await Promise.all(
          applicantsSnapshot.docs.map(async (doc) => {
            const userId = doc.id;
            const applicantData = doc.data();


            // Fetch submissions
            const submissionsRef = collection(db, "applicants", userId, "submissions");
            const submissionsSnapshot = await getDocs(submissionsRef);
            const submissions = submissionsSnapshot.docs.map((subDoc) => subDoc.data());


            // Fetch applied jobs
            const appliedJobsRef = collection(db, "applicants", userId, "appliedJobs");
            const appliedJobsSnapshot = await getDocs(appliedJobsRef);
            const appliedJobs = appliedJobsSnapshot.docs.map((jobDoc) => jobDoc.data());
            
            return {
              ...applicantData,
              userId,
              submissions,
              appliedJobs,
            };
          })
        );
        setApplicants(applicantsData);
      } catch (error) {
        console.error("Error fetching applicants:", error);
      }
    };


    fetchApplicants();
  }, []);
  useEffect(() => {
    const fetchPendingJobs = async () => {
      try {
        const jobsSnapshot = await getDocs(collection(db, "jobs-to-be-approved"));
        const jobsData = jobsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPendingJobs(jobsData);
      } catch (error) {
        console.error("Error fetching pending jobs:", error);
      }
    };


    fetchPendingJobs();
  }, []);
  const handleToggleClass = () => {
    // // Only toggle visibility if selectedUserType is "Applicants" or "Employers"
    // if (selectedUserType !== "Applicants" || selectedUserType !== "Employers") {
    //   // Set the selectedUserType to "JobsToBeApproved"
    //   setSelectedUserType("JobsToBeApproved");
  
    // // Find the element with the "JobsToBeApproved" class or ID
    // const jobsToBeApprovedElement = document.querySelector(".JobsToBeApproved");


    //   // Check if the element exists before toggling visibility
    //   if (jobsToBeApprovedElement) {
    //     setIsUserClassVisible(true); // Show the JobsToBeApproved content
    //   }
    // }
    setIsUserClassVisible(true);
    setUserApproval(false);
    setHistoryVisible(false);
    setShowAnnouncement(false);
  };
  const handleToggleApproval = () => {
    // // Only toggle visibility if selectedUserType is "Applicants" or "Employers"
    // if (selectedUserType !== "Applicants" || selectedUserType !== "Employers") {
    //   // Set the selectedUserType to "JobsToBeApproved"
    //   setSelectedUserType("JobsToBeApproved");
  
    // // Find the element with the "JobsToBeApproved" class or ID
    // const jobsToBeApprovedElement = document.querySelector(".JobsToBeApproved");


    //   // Check if the element exists before toggling visibility
    //   if (jobsToBeApprovedElement) {
    //     setIsUserClassVisible(true); // Show the JobsToBeApproved content
    //   }
    // }
    setUserApproval(true);
  };
  // Fetch Users to Approve
const [usersToApprove, setUsersToApprove] = useState([]);
const [deletedFiles, setDeletedFiles] = useState([]);
const [showDeletedFiles, setShowDeletedFiles] = useState(false); // Toggle for deleted files view
const [announcementVisible, setShowAnnouncement] = useState(false);


useEffect(() => {
    const fetchUsersToApprove = async () => {
        try {
            const snapshot = await getDocs(collection(db, "userAccountsToBeApproved"));
            const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setUsersToApprove(users);
        } catch (error) {
            console.error("Error fetching users to approve:", error);
        }
    };


    fetchUsersToApprove();
}, [showDeletedFiles]);


useEffect(() => {
  const fetchUsersToApprove = async () => {
    try {
      const snapshot = await getDocs(collection(db, "userAccountsToBeApproved"));
      const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setUsersToApprove(users);
    } catch (error) {
      console.error("Error fetching users to approve:", error);
    }
  };
  const fetchDeletedFiles = async () => {
    try {
        const snapshot = await getDocs(collection(db, "deletedFiles"));
        const files = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setDeletedFiles(files);
    } catch (error) {
        console.error("Error fetching deleted files:", error);
    }
};
if (showDeletedFiles) fetchDeletedFiles();
  fetchUsersToApprove();
}, [showDeletedFiles]); 


// useEffect(() => {
//   const fetchHistoryData = async () => {
//     try {
//       const snapshot = await getDocs(collection(db, "historyData"));
//       const history = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
//       setHistoryData(history);
//     } catch (error) {
//         console.error("Error fetching history data: ",error);
//     }
//   };
//   if (historyVisible) fetchHistoryData();
// }, [historyVisible]);
useEffect(() =>{
const fetchHistoryData = async () => {
  try {
    const snapshot = await getDocs(collection(db, "historyData"));
    const history = snapshot.docs.map((doc) => {
      const data = doc.data();
      const timestamp = data.timestamp; // Assuming your field is named 'timestamp'
      if (timestamp) {
        data.timestamp = timestamp.toDate().toLocaleString(); // Convert timestamp to readable date
      }
      return { id: doc.id, ...data };
    });
    setHistoryData(history);
  } catch (error) {
    console.error("Error fetching history data: ", error);
  }
};
if (historyVisible) fetchHistoryData();
}, [historyVisible]);


// Approve User
const handleApproveUser = async (user) => {
    try {
        const targetCollection = user.type === "applicant" ? "applicants" : "employers";


        // Add user to the target collection
        await setDoc(doc(db, targetCollection, user.id), { ...user, status: "approved" });


        // Remove user from the approval collection
        await deleteDoc(doc(db, "userAccountsToBeApproved", user.id));


        // Update local state
        setUsersToApprove(usersToApprove.filter((u) => u.id !== user.id));
        alert("User approved successfully.");


        await addHistoryRecord('User Approved', `User ${user.id} approved.`); // Add history record with timestamp


    } catch (error) {
        console.error("Error approving user:", error);
        alert("Failed to approve user. Please try again.");
    }
};


// Reject User
const handleRejectUser = async (user) => {
    try {
        // Move user data to the `deletedFiles` collection
        await setDoc(doc(db, "deletedFiles", user.id), user);


        // Remove user from the approval collection
        await deleteDoc(doc(db, "userAccountsToBeApproved", user.id));


        // Update local state
        setUsersToApprove(usersToApprove.filter((u) => u.id !== user.id));
        alert("User rejected and moved to deleted files.");


        await addHistoryRecord('User Rejected', `User ${user.id} rejected.`); // Add history record with timestamp


    } catch (error) {
        console.error("Error rejecting user:", error);
        alert("Failed to reject user. Please try again.");
    }
};


  // Fetch Employers
  useEffect(() => {
    const fetchEmployers = async () => {
      try {
        const employersSnapshot = await getDocs(collection(db, "employers"));
        const employersData = employersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEmployers(employersData);
      } catch (error) {
        console.error("Error fetching employers:", error);
      }
    };


    fetchEmployers();
  }, []);


  const handleLogin = () => {
    // Hardcoded Admin Credentials
    if (username === "admin" && password === "admin123") {
      setIsAdmin(true);
    } else {
      alert("Invalid credentials");
    }
  };
  // Handle Applicant Click
  const handleUserClick = async (user) => {
    if (selectedUserType === "Applicants") {
      // If the user is an applicant, set the user data with submissions and applied jobs
      setSelectedUser({
        ...user,
        submissions: user.submissions || [],
        appliedJobs: user.appliedJobs || [],
      });
    } else {
      // If the user is an employer, set the employer data and fetch the posted jobs
      setSelectedUser(user);
  
      // Fetch the jobs posted by the employer
      const employerJobsQuery = query(collection(db, "jobs"), where("employerId", "==", user.id));
      const employerJobsSnapshot = await getDocs(employerJobsQuery);
      const jobs = employerJobsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      
      setEmployerJobs(jobs);  // Update the state with the employer's jobs
      setSelectedJob(null);    // Reset the selected job
      setJobApplicants([]);   // Clear applicants for the selected job
    }
  };
  
  // Handle Employer Click: Fetch jobs posted by employer
  const handleEmployerClick = async (employer) => {
    setSelectedUser(employer);
    const employerJobsQuery = query(collection(db, "jobs"), where("employerId", "==", employer.id));
    const employerJobsSnapshot = await getDocs(employerJobsQuery);
  
    const jobs = employerJobsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    console.log("Fetched Jobs for Employer:", jobs);  // Debugging log
  
    setEmployerJobs(jobs);
  
    if (jobs.length === 0) {
      console.log("No jobs found for this employer.");  // Debugging log if no jobs are found
    }
  
    setSelectedJob(null);
    setJobApplicants([]);
  };
  
  


  // Handle Job Click: Fetch applicants for the selected job
  const handleJobClick = async (jobId) => {
    setSelectedJob(jobId);
    const applicantsRef = collection(db, "jobs", jobId, "applications");
    const applicantsSnapshot = await getDocs(applicantsRef);
    const applicants = applicantsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setJobApplicants(applicants);
  };
  


  // Handle Applicant Click (from employer's job applicants)
  const handleApplicantClick = (applicant) => {
    setSelectedApplicant(applicant);
    setIsApplicant(true);
  };


  // Close Modals
  const handleCloseUserModal = () => {
    setSelectedUser(null);
    setEmployerJobs([]);
    setSelectedJob(null);
    setJobApplicants([]);
  };


  const handleCloseApplicantModal = () => {
    setSelectedApplicant(null);
  };
  const handlePublishJob = async (job) => {
    try {
      // Add job to the 'jobs' collection
      await setDoc(doc(db, "jobs", job.id), job);


      // Delete job from 'jobs-to-be-approved'
      await deleteDoc(doc(db, "jobs-to-be-approved", job.id));


      // Update local state
      setPendingJobs(pendingJobs.filter((j) => j.id !== job.id));
      setSelectedJob(null);
      alert("Job published successfully.");


      await addHistoryRecord('Job Published', `Job post #${job.id} published.`); // Add history record with timestamp


    } catch (error) {
      console.error("Error publishing job:", error);
      alert("Failed to publish job. Please try again.");
    }
  };
  const handleRejectJob = async (jobId) => {
    try {
      setIsApplicant(true)
      // Delete job from 'jobs-to-be-approved'
      await deleteDoc(doc(db, "jobs-to-be-approved", jobId));


      // Update local state
      setPendingJobs(pendingJobs.filter((j) => j.id !== jobId));
      setSelectedJob(null);
      alert("Job rejected successfully.");


      await addHistoryRecord('Job Post Rejected',  `Job post #${jobId} rejected.` );
    } catch (error) {
      console.error("Error rejecting job:", error);
      alert("Failed to reject job. Please try again.");
    }
  };
  useEffect(() => {
    const userDiv = document.querySelector(".user");
    if (userDiv) {
      if (selectedUserType === "JobsToBeApproved") {
        userDiv.classList.add("user");
      } else {
        userDiv.classList.remove("user");
      }
    }
  }, [selectedUserType]);


  const toggleUserDivClass = () => {
    setSelectedUserType(selectedUserType === "JobsToBeApproved" ? "Applicants" : "JobsToBeApproved");
  };


  const handleAnnouncementSend = async () => {
    if (!emailSubject || !emailBody || !recipientType) {
      console.error("Missing required data (subject, body, or recipient type).");
      alert("Please fill out all fields and select a recipient type.");
      return;
    }


    try {
      let selectedUsers = recipientType === "applicant" ? applicants : employers;


      // If there's an image file, upload it to Firebase Storage
      let imageUrl = '';
      if (imageFile) {
        const storageRef = ref(storage, `images/${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef); // Get the URL of the uploaded image
        console.log('Image URL:', imageUrl);
      }


      // Create the email content with embedded image (if image was uploaded)
      const emailContent = `
        <p>${emailBody}</p>
        ${imageUrl ? `<img src="${imageUrl}" alt="Attached Image" style="max-width: 100%; height: auto;" />` : ""}
      `;
      
      // Send notification to each selected user
      for (const user of selectedUsers) {
        const notificationsRef = collection(db, recipientType + "s", user.id, "notifications");


        const newNotification = {
          subject: emailSubject,
          message: emailContent,
          timestamp: new Date(),
          status: "unread", // Initially unread
        };


        await addDoc(notificationsRef, newNotification);
        console.log(`Notification added for ${recipientType}: `, user.id);
      }


      alert("Announcement sent successfully!");


      setEmailSubject("");
      setEmailBody("");
      setImageFile(null); // Reset image file
      setShowAnnouncement(false);
    } catch (error) {
      console.error("Error sending notification:", error);
      alert("Failed to send announcement.");
    }
  };


  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file); // Store the selected image
    }
  };
  
  
  if (!isAdmin) {
    return (
        <div style={{ 
            display: "flex", 
            justifyContent: "center", 
            alignItems: "center", 
            minHeight: "80vh",  // Adjusted height
            fontFamily: "Arial, sans-serif"
        }}>
            <form onSubmit={handleLogin} style={{ 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center", 
                width: "100%", 
                maxWidth: "600px", 
                padding: "60px 40px", // More compact
                borderRadius: "10px", 
                boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)", 
                background: "white",
                textAlign: "center"
            }}>
                <h2 style={{ marginBottom: "15px", fontFamily: "Times New Roman" }}>Admin Login</h2>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    style={{ 
                        width: "100%", 
                        padding: "10px", 
                        marginBottom: "10px", 
                        borderRadius: "5px", 
                        border: "1px solid #ccc", 
                        fontSize: "16px", 
                        textAlign: "center"
                    }}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ 
                        width: "100%", 
                        padding: "10px", 
                        marginBottom: "10px", 
                        borderRadius: "5px", 
                        border: "1px solid #ccc", 
                        fontSize: "16px", 
                        textAlign: "center"
                    }}
                />
                <button
                    type="submit"
                    style={{
                        width: "100%",
                        padding: "10px", 
                        backgroundColor: "#007bff", 
                        color: "#fff", 
                        border: "none", 
                        borderRadius: "5px", 
                        cursor: "pointer",
                        fontSize: "16px",
                        transition: "0.3s"
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = "#0056b3"}
                    onMouseOut={(e) => e.target.style.backgroundColor = "#007bff"}
                >
                    Login
                </button>
            </form>
        </div>
    );
  }
  return (
    <><div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2>Admin Page</h2>


      <button
      onClick={() => {
        // Example log-out logic: remove user data or session
        localStorage.removeItem("authToken"); // Adjust according to your auth mechanism
        window.location.href = "./"; // Redirect to login page after logout
      }}
      style={{
        position: "absolute", // Absolute positioning to place it at the top right
        top: "20px",
        right: "20px",
        padding: "10px 20px",
        backgroundColor: "#f44336", // Red background for logout
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        fontWeight: "bold",
        transition: "background-color 0.3s",
      }}
      onMouseEnter={(e) => e.target.style.backgroundColor = "#d32f2f"} // Darker red on hover
      onMouseLeave={(e) => e.target.style.backgroundColor = "#f44336"} // Revert on leave
    >
      Log Out
    </button>


      {/* User Type Toggle */}
      <div style={{ marginBottom: "20px" }}>
        <button
         onClick={() => {
            setSelectedUserType("Applicants");
            setIsUserClassVisible(false);
            setUserApproval(false);
            setShowDeletedFiles(false);
            setHistoryVisible(false);
            setShowAnnouncement(false);
          }}
          
          style={{
            marginRight: "10px",
            padding: "10px 15px",
            backgroundColor: selectedUserType === "Applicants" && !isUserClassVisible ? "#007bff" : "#ddd",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          View Applicants
        </button>
        <button
          onClick={() => {
            setSelectedUserType("Employers");
            setIsUserClassVisible(false);
            setUserApproval(false);
            setShowDeletedFiles(false);
            setHistoryVisible(false);
            setShowAnnouncement(false);
        }}
          style={{
            padding: "10px 15px",
            backgroundColor: selectedUserType === "Employers" && !isUserClassVisible ? "#007bff" : "#ddd",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          View Employers
        </button>
        <button
          onClick={handleToggleClass}  
            style={{
              marginLeft:"10px",
              marginRight: "10px",
              padding: "10px 15px",
              backgroundColor: isUserClassVisible && !isUserApproval && !historyVisible ? "#007bff" : "#ddd",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
           }}      
          >
          Jobs to Be Approved
        </button>
        <button
          onClick={() => {
            setUserApproval(true);
            setShowDeletedFiles(false); 
            setIsUserClassVisible(false);
            setSelectedUserType(false);
            setHistoryVisible(false);
            setShowAnnouncement(false);
        }}
          style={{
            marginRight: "10px" , 
            padding: "10px 15px",
            backgroundColor: isUserApproval && !historyVisible ? "#007bff" : "#ddd",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
        }}
        >
          View User Accounts ({usersToApprove.length || 0} Waiting)
        </button>


        <button
          onClick={() => {
            setShowDeletedFiles(true);
            setUserApproval(false); 
            setIsUserClassVisible(false);
            setSelectedUserType("");
            setHistoryVisible(false);
            setShowAnnouncement(false);
        }}
          style={{
            padding: "10px 15px",
            backgroundColor: showDeletedFiles ? "#007bff" : "#ddd",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
        }}
        >
          View Deleted Files
        </button>


        {/* History Button */}
        <button
          onClick={() => {
            setHistoryVisible(true);
            setShowDeletedFiles(false);
            setUserApproval(false); 
            setIsUserClassVisible(false);
            setSelectedUserType("");
            setShowAnnouncement(false);
          }}
          style={{
            marginLeft: "10px",
            padding: "10px 15px",
            backgroundColor: historyVisible ? "#007bff" : "#ddd", // green color for history
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          History
        </button>


        {/* Announcement Button */}
        <button
          onClick={() => {
            setShowAnnouncement(true);
            setHistoryVisible(false);
            setShowDeletedFiles(false);
            setUserApproval(false); 
            setIsUserClassVisible(false);
            setSelectedUserType("");
          }}
          style={{
            marginLeft: "10px",
            padding: "10px 15px",
            backgroundColor: announcementVisible ? "#007bff" : "#ddd", // green color for history
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Announcement
        </button>
    </div>


      {/* User Table */}
      {!isUserClassVisible && !isUserApproval && !showDeletedFiles && !historyVisible && !announcementVisible &&(
      <div className="user" style={{ border: "1px solid #ddd", borderRadius: "5px", padding: "20px" }}>
        <h3>{selectedUserType}</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ddd", padding: "10px" }}>
                {selectedUserType === "Applicants" ? "Name" : "Company Name"}
              </th>
              <th style={{ border: "1px solid #ddd", padding: "10px" }}>Email</th>
              <th style={{ border: "1px solid #ddd", padding: "10px" }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {(selectedUserType === "Applicants" ? applicants : employers).map((user) => (
              <tr key={user.id || user.userId}>
                <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                  {user.name || user.companyName}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "10px" }}>{user.email}</td>
                <td style={{ border: "1px solid #ddd", padding: "10px", textAlign: "center" }}>
                  <button
                    onClick={() => handleUserClick(user)}
                    style={{
                      padding: "5px 10px",
                      backgroundColor: "#007bff",
                      color: "#fff",
                      border: "none",
                      borderRadius: "3px",
                      cursor: "pointer",
                    }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
      {/* Detailed Applicant Modal */}
      {selectedUser && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "5px",
              maxWidth: "600px",
              width: "90%",
              maxHeight: "80%",
              overflowY: "auto",
            }}
          >
            <h4>{selectedUserType === "Applicants" ? "Applicant Details" : ("Employer Details" && selectedUserType !== "JobsToBeApproved")}</h4>


            {selectedUserType === "Applicants" && !isUserClassVisible ? (
  <>
    <p>
      <strong>Name:</strong> {selectedUser.name}
    </p>
    <p>
      <strong>Email:</strong> {selectedUser.email}
    </p>
    <p>
      <strong>Resume:</strong>{" "}
      <a href={selectedUser.resumeURL} target="_blank" rel="noopener noreferrer">
        View Resume
      </a>
    </p>
    <h5>Submissions</h5>
    <ul>
      {selectedUser.submissions?.map((submission, index) => (
        <li key={index}>
          <strong>Live Demo:</strong>{" "}
          <a href={submission.liveDemoLink} target="_blank" rel="noopener noreferrer">
            View
          </a>{" "}
          | <strong>Demo Video:</strong>{" "}
          <a href={submission.demoVideoLink} target="_blank" rel="noopener noreferrer">
            Watch
          </a>
        </li>
      ))}
    </ul>
    <h5>Applied Jobs</h5>
    <ul>
      {selectedUser.appliedJobs?.map((job, index) => (
        <li key={index}>
          <p>
            <strong>Job Title:</strong> {job.title}
          </p>
          <p>
            <strong>Location:</strong> {job.location}
          </p>
          <p>
            <strong>Applied At:</strong> {job.appliedAt?.toDate().toLocaleString() || "N/A"}
          </p>
        </li>
      ))}
    </ul>
  </>
) : selectedUserType !== "Applicants" &&  !isUserClassVisible ? (
  <>
    <p>
      <strong>Company Name:</strong> {selectedUser.companyName}
    </p>
    <p>
      <strong>Email:</strong> {selectedUser.email}
    </p>
    <h5>Posted Jobs</h5>
    <ul>
      {employerJobs.map((job, index) => (
        <li key={index}>
          <p>
            <strong>Job Title:</strong> {job.title}
          </p>
          <p>
            <strong>Location:</strong> {job.location}
          </p>
          <p>
            <button onClick={() => handleJobClick(job.id)} style={{ cursor: "pointer" }}>
              View Applicants
            </button>
          </p>
        </li>
      ))}
    </ul>
  </>
) : null}




            <button
              onClick={handleCloseUserModal}
              style={{
                marginTop: "20px",
                padding: "10px 15px",
                backgroundColor: "#007bff",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}


      {/* Job Applicants Modal */}
      {selectedJob && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "5px",
              maxWidth: "600px",
              width: "90%",
              maxHeight: "80%",
              overflowY: "auto",
            }}
          >
            <h4>Job Applicants</h4>
            <ul>
              {jobApplicants.map((applicant, index) => (
                <li key={index}>
                  <p>
                    <strong>Name:</strong> {applicant.name}
                  </p>
                  <p>
                    <button
                      onClick={() => handleApplicantClick(applicant)}
                      style={{
                        padding: "5px 10px",
                        backgroundColor: "#007bff",
                        color: "#fff",
                        border: "none",
                        borderRadius: "3px",
                        cursor: "pointer",
                      }}
                    >
                      View Applicant
                    </button>
                  </p>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setSelectedJob(null)}
              style={{
                marginTop: "20px",
                padding: "10px 15px",
                backgroundColor: "#007bff",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}


      {/* Applicant Detailed View */}
      {selectedApplicant && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "5px",
              maxWidth: "600px",
              width: "90%",
              maxHeight: "80%",
              overflowY: "auto",
            }}
          >
            <h4>Applicant Details</h4>
            <p>
              <strong>Name:</strong> {selectedApplicant.name}
            </p>
            <p>
              <strong>Email:</strong> {selectedApplicant.email}
            </p>
            <p>
              <strong>Resume:</strong>{" "}
              <a href={selectedApplicant.resumeURL} target="_blank" rel="noopener noreferrer">
                View Resume
              </a>
            </p>
            <button
              onClick={handleCloseApplicantModal}
              style={{
                marginTop: "20px",
                padding: "10px 15px",
                backgroundColor: "#007bff",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
    {(isUserClassVisible == true) && !selectedUser &&(
        <div  style={{ border: "1px solid #ddd", borderRadius: "5px", padding: "20px", fontFamily: "Arial, sans-serif" }}>
          <h3>Jobs to Be Approved</h3>


          {/* Pending Jobs Table */}
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #ddd", padding: "10px" }}>Job Title</th>
                <th style={{ border: "1px solid #ddd", padding: "10px" }}>Company Name</th>
                <th style={{ border: "1px solid #ddd", padding: "10px" }}>Location</th>
                <th style={{ border: "1px solid #ddd", padding: "10px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingJobs.map((job) => (
                <tr key={job.id}>
                  <td style={{ border: "1px solid #ddd", padding: "10px" }}>{job.title}</td>
                  <td style={{ border: "1px solid #ddd", padding: "10px" }}>{job.companyName}</td>
                  <td style={{ border: "1px solid #ddd", padding: "10px" }}>{job.location}</td>
                  <td style={{ border: "1px solid #ddd", padding: "10px", textAlign: "center" }}>
                    <button
                      onClick={() => {
                        setSelectedJob(job);
                        setIsApplicant(false);
                      }}
                      style={{
                        padding: "5px 10px",
                        marginRight: "5px",
                        backgroundColor: "#007bff",
                        color: "#fff",
                        border: "none",
                        borderRadius: "3px",
                        cursor: "pointer",
                      }}
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleRejectJob(job.id)}
                      style={{
                        padding: "5px 10px",
                        backgroundColor: "#ff4d4d",
                        color: "#fff",
                        border: "none",
                        borderRadius: "3px",
                        cursor: "pointer",
                      }}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>


          {/* Job Details Modal */}
          {selectedJob && !isApplicant && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div
                id="jobdetails"
                style={{
                  backgroundColor: "#fff",
                  padding: "20px",
                  borderRadius: "5px",
                  maxWidth: "600px",
                  width: "90%",
                  maxHeight: "80%",
                  overflowY: "auto",
                }}
              >
                <h4>Job Details</h4>
                <p>
                  <strong>Title:</strong> {selectedJob.title}
                </p>
                <p>
                  <strong>Company Name:</strong> {selectedJob.companyName}
                </p>
                <p>
                  <strong>Location:</strong> {selectedJob.location}
                </p>
                <p>
                  <strong>Description:</strong> {selectedJob.description || "No description provided."}
                </p>
                <button
                  onClick={() => {
                    handlePublishJob(selectedJob);
                    setSelectedJob(null);
                  }}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#28a745",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    marginRight: "10px",
                  }}
                >
                  Publish
                </button>
                <button
                  onClick={() => setSelectedJob(null)}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#6c757d",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
            
          )}
        </div>
      )}


      {/* View User Acconts To Be Approve Section */}
      {!showDeletedFiles && !isUserClassVisible && !selectedUserType && !historyVisible && !announcementVisible &&(
        <div  style={{ border: "1px solid #ddd", borderRadius: "5px", padding: "20px", fontFamily: "Arial, sans-serif" }}>
            <h3>Users Pending Approval</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr>
                        <th style={{ border: "1px solid #ddd", padding: "10px" }}>Name/Company</th>
                        <th style={{ border: "1px solid #ddd", padding: "10px" }}>Email</th>
                        <th style={{ border: "1px solid #ddd", padding: "10px" }}>Type</th>
                        <th style={{ border: "1px solid #ddd", padding: "10px" }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {usersToApprove.map((user) => (
                        <tr key={user.id}>
                            <td style={{ border: "1px solid #ddd", padding: "10px" }}>{user.type === "applicant" ? user.name : user.companyName}</td>
                            <td style={{ border: "1px solid #ddd", padding: "10px" }}>{user.email}</td>
                            <td style={{ border: "1px solid #ddd", padding: "10px" }}>{user.type}</td>
                            <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                                <button 
                                  onClick={() => handleApproveUser(user)
                                  }
                                  style={{
                                    padding: "5px 10px",
                                    marginRight: "5px",
                                    backgroundColor: "#007bff",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "3px",
                                    cursor: "pointer",
                                  }}
                                  >Approve
                                  </button>
                                <button 
                                  onClick={() => handleRejectUser(user)
                                  }
                                  style={{
                                    padding: "5px 10px",
                                    marginRight: "5px",
                                    backgroundColor: "#ff4d4d",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "3px",
                                    cursor: "pointer",
                                  }}
                                  >Reject
                                  </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )}
    {/* Archives Section */}
    {showDeletedFiles && !selectedUserType && !isUserClassVisible && !historyVisible && !announcementVisible &&(
        <div  style={{ border: "1px solid #ddd", borderRadius: "5px", padding: "20px", fontFamily: "Arial, sans-serif" }}>
            <h3>Deleted Files</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr>
                        <th style={{ border: "1px solid #ddd", padding: "10px" }}>Name/Company</th>
                        <th style={{ border: "1px solid #ddd", padding: "10px" }}>Email</th>
                        <th style={{ border: "1px solid #ddd", padding: "10px" }}>Type</th>
                        <th style={{ border: "1px solid #ddd", padding: "10px" }}>Reason</th>
                    </tr>
                </thead>
                <tbody>
                    {deletedFiles.map((file) => (
                        <tr key={file.id}>
                            <td style={{ border: "1px solid #ddd", padding: "10px" }}>{file.type === "applicant" ? file.name : file.companyName}</td>
                            <td style={{ border: "1px solid #ddd", padding: "10px" }}>{file.email}</td>
                            <td style={{ border: "1px solid #ddd", padding: "10px" }}>{file.type}</td>
                            <td style={{ border: "1px solid #ddd", padding: "10px" }}>{file.reason || "N/A"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )}


{historyVisible && !isUserApproval && !showDeletedFiles && !selectedUserType && !isUserClassVisible && !announcementVisible && (
        <div style={{  border: "1px solid #ddd", borderRadius: "5px", padding: "20px" }}>
          <h3>History</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #ddd", padding: "10px" }}>Timestamp</th>
                <th style={{ border: "1px solid #ddd", padding: "10px" }}>Event</th>
                <th style={{ border: "1px solid #ddd", padding: "10px" }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {historyData.map((record, index) => (
                <tr key={index}>
                  <td style={{ border: "1px solid #ddd", padding: "10px" }}>{record.timestamp}</td>
                  <td style={{ border: "1px solid #ddd", padding: "10px" }}>{record.event}</td>
                  <td style={{ border: "1px solid #ddd", padding: "10px" }}>{record.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}


      {/* Announcement tab */}
      {announcementVisible && !historyVisible && !isUserApproval && !showDeletedFiles && !selectedUserType && !isUserClassVisible && (
        <div
          style={{
            marginTop: "20px",
            marginLeft: "auto",
            marginRight: "auto",
            padding: "10px 20px",
            border: "1px solid #ddd",
            borderRadius: "5px",
            backgroundColor: "#f9f9f9",
            maxWidth: "1200px",
            width: "90%",
            textAlign: "center",
          }}
        >
          <h3>Announcement</h3>
          <p>This is for important announcement!</p>


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


          <div>
          <label htmlFor="image-upload" style={{ marginBottom: '10px', display: 'block' }}>
            Upload Image:
          </label>
          <input
            type="file"
            id="image-upload"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ marginBottom: '10px' }}
          />
        </div>


          {/* Recipient Dropdown */}
          <div style={{ marginTop: "10px" }}>
            <label>
              Select Recipient Type:
              <select
                value={recipientType || ""}
                onChange={(e) => setRecipientType(e.target.value)}
                style={{
                  marginLeft: "10px",
                  padding: "8px",
                  borderRadius: "5px",
                  fontSize: "16px",
                }}
              >
                <option value="">Select Recipient</option>
                <option value="applicant">Applicant</option>
                <option value="employer">Employer</option>
              </select>
            </label>
          </div>


          <button
            onClick={handleAnnouncementSend}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              backgroundColor: "#28a745",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Send Announcement
          </button>
        </div>
      )}



    </>
  );
};


export default AdminPage;