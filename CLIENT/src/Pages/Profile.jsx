// import { io } from "socket.io-client";
// import { useMemo, useEffect, useState } from "react";

// const Profile = () => {
//   const socket = useMemo(() => io("http://localhost:4000"), []); // ✅ Memoized socket instance

//   useEffect(() => {
    
//     socket.on("connect", () => {
//         console.log("Connected:", socket.id);
//     });
//     // 3) LISTEN FOR ALL USERS : Login and Logout
//     socket.on("update_users", (users) => {
//     setOnlineUsers(users); 
//     });
//     return () => {
//       socket.disconnect();
//       console.log("Disconnected from socket");
//     };
//   }, [socket]); // ✅ Dependency added for safety
//   const [onlineUsers, setOnlineUsers] = useState({});
//   // SET FRIEND DATA AND SOCKET ID IF ONLINE


//   return <div>Profile Page</div>;
// };

// export default Profile;
