/* eslint-disable no-unused-vars */
import React from 'react';
import AppRoutes from './routes/AppRoutes';
// import './App.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { UserProvider } from './context/UserContext'; 
import { BrowserRouter } from 'react-router-dom';


const App = () => {
  return (
    <>
     <BrowserRouter>
     <UserProvider>
      <AppRoutes />
      <ToastContainer 
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        </UserProvider>
        </BrowserRouter>
    </>
  );
};

export default App;
