import { getAuth, deleteUser, signOut, GoogleAuthProvider, reauthenticateWithPopup } from "firebase/auth";

const deleteFirebaseAccount = async () => {

  const auth = getAuth();
  const user = auth.currentUser;

  // Re-Authenticate a user
  const provider = new GoogleAuthProvider();

  reauthenticateWithPopup(user, provider).then(() => {
    console.log("reauthenticated")
    deleteUser(user) // Delete the User
    .then(() => {
      console.log("user has been deleted")
      })
      .catch((error) => {
      console.log("user has NOT been deleted, error")
  });
  }).catch((error) => {
  console.log("there was an error")
  })

} 

const deleteIndexedDatabases = async () => {
    const databases = await indexedDB.databases();
    // Delete the local databases
    databases.forEach((element) => {
        if (element.name != "firebaseLocalStorageDb" && element.name != "firebase-heartbeat-database") {
            const request = indexedDB.deleteDatabase(element.name)
        }
    });
}


const deleteAllData = async () => {
    // Put all the deletion methods together 
    deleteIndexedDatabases();
    deleteFirebaseAccount();
};


export const deleteConfirmation = async () => {
  if (confirm("Are you sure you want to delete your account? RINDFUL will delete all your user data immediately.")) {
    deleteAllData()
  } else {
    console.log("User did not want to delete their data.")
  }
}