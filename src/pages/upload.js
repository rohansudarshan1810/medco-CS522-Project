import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient"; // Make sure this file is correctly set up


function Upload() {
    const navigate = useNavigate();
    const [uploadStatus, setUploadStatus] = useState("");
    const [userName, setUserName] = useState("");

    // Handle file upload
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];

        if (!file) {
            alert("Please select a file!");
            return;
        }

        // Check if the user is logged in
        const {
            data: { session },
            error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
            console.error("Error fetching session:", sessionError.message);
            alert("Unable to fetch session. Please try again.");
            return;
        }

        if (!session) {
            alert("You must be logged in to upload files.");
            return;
        }

        const userId = session.user.id; // Get the user's unique ID

        setUploadStatus("Uploading...");

        try {
            // Upload file to Supabase Storage under a user-specific folder
            const { data, error } = await supabase.storage
                .from("pdf-uploads") // Replace with your Supabase bucket name
                .upload(`uploads/${userId}/${file.name}`, file, {
                    cacheControl: "3600", // Optional cache control
                    upsert: false, // Optional: set to false to avoid overwriting files
                });

            if (error) {
                throw new Error(error.message);
            }

            console.log("File uploaded successfully:", data);
            setUploadStatus("File uploaded successfully!");

            // Redirect to the visualization page
            navigate("/visualization");
        } catch (error) {
            console.error("Upload failed:", error);
            setUploadStatus(`Upload failed: ${error.message}`);
        }
    };

    // Fetch the user's name from the logged-in user's metadata
    useEffect(() => {
        const fetchUser = async () => {
            const {
                data: { session },
                error: sessionError,
            } = await supabase.auth.getSession();

            if (sessionError) {
                console.error("Error fetching session:", sessionError.message);
                return;
            }

            if (session) {
                const name = session.user.user_metadata
                    ? session.user.user_metadata.full_name
                    : "User";
                setUserName(name);
            }
        };

        fetchUser();

        // Listen to authentication changes
        const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
            const name = session?.user?.user_metadata?.full_name || "User";
            setUserName(name);
        });

        return () => {
            if (subscription && subscription.unsubscribe) {
                subscription.unsubscribe(); // Correctly unsubscribe
            }
        };
    }, []);

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                {userName && <p style={styles.greeting}>Hi! {userName}</p>}
            </div>

            <h1 style={styles.title}>MedCo</h1>
            <div style={styles.uploadSection}>
                <label htmlFor="pdfUpload" style={styles.uploadLabel}>
                    Upload Your PDF
                </label>
                <input
                    type="file"
                    id="pdfUpload"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    style={styles.uploadInput}
                />
            </div>
            {uploadStatus && <p>{uploadStatus}</p>}
        </div>
    );
}


// Inline Styles
const styles = {
    container: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "#e0f7f7", // Background color matching your design
        padding: "20px",  // Added padding to avoid elements being stuck to the edges
    },
    header: {
        width: "100%",
        position: "absolute",
        top: "20px",
        right: "20px",
        textAlign: "right",
    },
    greeting: {
        fontSize: "1.2rem",
        color: "#008080", // Teal color for the greeting
        fontWeight: "bold",
    },
    title: {
        fontSize: "2rem",
        color: "#008080", // Teal color for the title
        marginBottom: "20px",
    },
    uploadSection: {
        textAlign: "center",
    },
    uploadLabel: {
        display: "inline-block",
        padding: "10px 20px",
        backgroundColor: "#008080",
        color: "white",
        fontSize: "16px",
        borderRadius: "5px",
        cursor: "pointer",
    },
    uploadInput: {
        display: "none", // Hide the default file input
    },
};

export default Upload;
