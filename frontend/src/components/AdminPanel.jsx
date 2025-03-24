


// import React, { useState, useEffect } from 'react';
// import { adminService } from '../utils/axiosConfig';
// import { FaUserPlus, FaUserEdit, FaUserMinus, FaKey, FaSave, FaTimes, FaLock, FaUnlock } from 'react-icons/fa';
// import Header from '../components/dashboard/Header';

// // List of available modules to match the ones from projects page
// const availableModules = [
//   { id: "document-qa", name: "Document Q&A" },
//   { id: "idea-generator", name: "Idea Generator" },
//   { id: "topic-modeling", name: "Topic Modeling" },
//   { id: "structured-data-query", name: "Structured Data Query" }
// ];

// // Main Admin Panel Component
// const AdminPanel = () => {
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [isModulePermissionsModalOpen, setIsModulePermissionsModalOpen] = useState(false);
//   const [currentUser, setCurrentUser] = useState(null);
//   const [formData, setFormData] = useState({
//     username: '',
//     email: '',
//     password: '',
//     huggingface_token: '',
//     gemini_token: ''
//   });

//   // State for module permissions
//   const [modulePermissions, setModulePermissions] = useState({});

//   // Fetch all users on component mount
//   useEffect(() => {
//     fetchUsers();
//   }, []);

//   // Function to fetch all users
//   const fetchUsers = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const data = await adminService.getAllUsers();
//       setUsers(data);
//     } catch (err) {
//       setError('Failed to fetch users. Please try again.');
//       console.error('Error fetching users:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle input changes
//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   // Open edit modal with user data
//   const handleOpenEditModal = (user) => {
//     setCurrentUser(user);
//     setFormData({
//       huggingface_token: user.api_tokens.huggingface_token || '',
//       gemini_token: user.api_tokens.gemini_token || ''
//     });
//     setIsEditModalOpen(true);
//   };

//   // Open module permissions modal
//   const handleOpenModulePermissionsModal = (user) => {
//     setCurrentUser(user);
//     // Initialize module permissions with the user's current settings
//     setModulePermissions(user.disabled_modules || {});
//     setIsModulePermissionsModalOpen(true);
//   };

//   // Toggle module permission for a user
//   const toggleModulePermission = (moduleId) => {
//     setModulePermissions(prev => ({
//       ...prev,
//       [moduleId]: !prev[moduleId]
//     }));
//   };

//   // Handle form submission for new user
//   const handleCreateUser = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       await adminService.createUser(formData);
//       setIsAddModalOpen(false);
//       setFormData({
//         username: '',
//         email: '',
//         password: '',
//         huggingface_token: '',
//         gemini_token: ''
//       });
//       fetchUsers();
//     } catch (err) {
//       setError('Failed to create user. Please try again.');
//       console.error('Error creating user:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle form submission for updating user tokens
//   const handleUpdateTokens = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       await adminService.updateUserTokens(currentUser.id, {
//         huggingface_token: formData.huggingface_token,
//         gemini_token: formData.gemini_token
//       });
//       setIsEditModalOpen(false);
//       fetchUsers();
//     } catch (err) {
//       setError('Failed to update user tokens. Please try again.');
//       console.error('Error updating tokens:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle updating module permissions
//   const handleUpdateModulePermissions = async () => {
//     setLoading(true);
//     try {
//       await adminService.updateUserModulePermissions(currentUser.id, {
//         disabled_modules: modulePermissions
//       });
//       setIsModulePermissionsModalOpen(false);
      
//       // Update the local users state to reflect the changes
//       setUsers(prevUsers => 
//         prevUsers.map(user => 
//           user.id === currentUser.id 
//             ? { ...user, disabled_modules: modulePermissions } 
//             : user
//         )
//       );
//     } catch (err) {
//       setError('Failed to update module permissions. Please try again.');
//       console.error('Error updating module permissions:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle user deletion
//   const handleDeleteUser = async (userId, username) => {
//     if (window.confirm(`Are you sure you want to delete user "${username}"?`)) {
//       setLoading(true);
//       try {
//         await adminService.deleteUser(userId);
//         fetchUsers();
//       } catch (err) {
//         setError('Failed to delete user. Please try again.');
//         console.error('Error deleting user:', err);
//       } finally {
//         setLoading(false);
//       }
//     }
//   };

//   return (
//     <div className="bg-gradient-to-br from-gray-900 via-black to-emerald-900 min-h-screen text-white p-6">
//       <Header/>
//       <div className="max-w-6xl mx-auto">
//         <div className="flex justify-between items-center mb-8 mt-14">
//           <h1 className="text-3xl font-bold text-emerald-400">Admin Panel - User Management</h1>
//           <button 
//             className="bg-gradient-to-r from-blue-600/90 to-emerald-600/80 text-white px-4 py-2 rounded-md flex items-center shadow-lg transition-all"
//             onClick={() => setIsAddModalOpen(true)}
//           >
//             <FaUserPlus className="mr-2" /> Add New User
//           </button>
//         </div>

//         {/* Error Alert */}
//         {error && (
//           <div className="bg-red-500/80 text-white p-4 mb-6 rounded-md shadow-lg">
//             {error}
//           </div>
//         )}

//         {/* Users Table */}
//         <div className="bg-black/50 backdrop-blur-sm rounded-lg shadow-xl overflow-hidden border border-emerald-900/50">
//           <table className="w-full divide-y divide-gray-800/50">
//             <thead className="bg-black/70">
//               <tr>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">ID</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">Username</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">Email</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">API Keys</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">Module Permissions</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-800/50">
//               {users.map(user => (
//                 <tr key={user.id} className="hover:bg-emerald-900/20 transition-colors">
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.id}</td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.username}</td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.email}</td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
//                     <div className="flex flex-col">
//                       <span>
//                         <span className="text-blue-400">Hugging Face:</span> 
//                         {user.api_tokens.huggingface_token ? 
//                           `${user.api_tokens.huggingface_token.slice(0, 5)}...` : 
//                           'Not set'
//                         }
//                       </span>
//                       <span>
//                         <span className="text-emerald-400">Gemini:</span> 
//                         {user.api_tokens.gemini_token ? 
//                           `${user.api_tokens.gemini_token.slice(0, 5)}...` : 
//                           'Not set'
//                         }
//                       </span>
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 text-sm text-gray-300">
//                     <div className="flex flex-col">
//                       {user.disabled_modules ? 
//                         Object.entries(user.disabled_modules)
//                           .filter(([_, isDisabled]) => isDisabled)
//                           .map(([moduleId]) => {
//                             const module = availableModules.find(m => m.id === moduleId);
//                             return module ? (
//                               <span key={moduleId} className="text-red-400 flex items-center">
//                                 <FaLock className="mr-1" size={12} /> {module.name}
//                               </span>
//                             ) : null;
//                           }) 
//                         : 'All modules enabled'
//                       }
//                       {user.disabled_modules && 
//                         Object.values(user.disabled_modules).filter(Boolean).length === 0 && 
//                         'All modules enabled'
//                       }
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm">
//                     <div className="flex space-x-3">
//                       <button 
//                         className="text-blue-400 hover:text-emerald-300 transition-colors"
//                         onClick={() => handleOpenEditModal(user)}
//                         title="Edit API Tokens"
//                       >
//                         <FaKey size={16} />
//                       </button>
//                       <button 
//                         className="text-purple-400 hover:text-purple-300 transition-colors"
//                         onClick={() => handleOpenModulePermissionsModal(user)}
//                         title="Edit Module Permissions"
//                       >
//                         <FaLock size={16} />
//                       </button>
//                       <button 
//                         className="text-red-500 hover:text-red-400 transition-colors"
//                         onClick={() => handleDeleteUser(user.id, user.username)}
//                         title="Delete User"
//                         disabled={user.username === 'admin'}
//                       >
//                         <FaUserMinus size={16} />
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//               {users.length === 0 && !loading && (
//                 <tr>
//                   <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-400">
//                     No users found
//                   </td>
//                 </tr>
//               )}
//               {loading && (
//                 <tr>
//                   <td colSpan="6" className="px-6 py-4 text-center text-sm">
//                     <div className="flex justify-center items-center">
//                       <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-emerald-400"></div>
//                       <span className="ml-2 text-emerald-300">Loading...</span>
//                     </div>
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Add User Modal */}
//       {isAddModalOpen && (
//         <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
//           <div className="bg-gradient-to-br from-gray-900 to-black rounded-lg max-w-md w-full shadow-2xl border border-emerald-900/30">
//             <div className="flex justify-between items-center border-b border-gray-800 p-4">
//               <h2 className="text-xl font-semibold text-emerald-400">Add New User</h2>
//               <button 
//                 className="text-gray-400 hover:text-white transition-colors"
//                 onClick={() => setIsAddModalOpen(false)}
//               >
//                 <FaTimes />
//               </button>
//             </div>
//             <form onSubmit={handleCreateUser} className="p-4">
//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-emerald-300 mb-1">
//                   Username
//                 </label>
//                 <input
//                   type="text"
//                   name="username"
//                   value={formData.username}
//                   onChange={handleInputChange}
//                   className="w-full px-3 py-2 bg-black/50 border border-emerald-900/50 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
//                   required
//                 />
//               </div>
//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-emerald-300 mb-1">
//                   Email
//                 </label>
//                 <input
//                   type="email"
//                   name="email"
//                   value={formData.email}
//                   onChange={handleInputChange}
//                   className="w-full px-3 py-2 bg-black/50 border border-emerald-900/50 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
//                   required
//                 />
//               </div>
//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-emerald-300 mb-1">
//                   Password
//                 </label>
//                 <input
//                   type="password"
//                   name="password"
//                   value={formData.password}
//                   onChange={handleInputChange}
//                   className="w-full px-3 py-2 bg-black/50 border border-emerald-900/50 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
//                   required
//                 />
//               </div>
//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-emerald-300 mb-1">
//                   Hugging Face Token
//                 </label>
//                 <input
//                   type="text"
//                   name="huggingface_token"
//                   value={formData.huggingface_token}
//                   onChange={handleInputChange}
//                   className="w-full px-3 py-2 bg-black/50 border border-emerald-900/50 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
//                 />
//               </div>
//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-emerald-300 mb-1">
//                   Gemini Token
//                 </label>
//                 <input
//                   type="text"
//                   name="gemini_token"
//                   value={formData.gemini_token}
//                   onChange={handleInputChange}
//                   className="w-full px-3 py-2 bg-black/50 border border-emerald-900/50 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
//                 />
//               </div>
//               <div className="flex justify-end">
//                 <button
//                   type="button"
//                   className="mr-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition-colors"
//                   onClick={() => setIsAddModalOpen(false)}
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="px-4 py-2 bg-gradient-to-r from-blue-600/90 to-emerald-600/80 text-white rounded-md flex items-center transition-colors shadow-md"
//                   disabled={loading}
//                 >
//                   {loading ? (
//                     <>
//                       <div className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></div>
//                       Saving...
//                     </>
//                   ) : (
//                     <>
//                       <FaSave className="mr-2" /> Save
//                     </>
//                   )}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* Edit User Modal */}
//       {isEditModalOpen && currentUser && (
//         <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
//           <div className="bg-gradient-to-br from-gray-900 to-black rounded-lg max-w-md w-full shadow-2xl border border-emerald-900/30">
//             <div className="flex justify-between items-center border-b border-gray-800 p-4">
//               <h2 className="text-xl font-semibold text-emerald-400">
//                 Edit API Tokens - {currentUser.username}
//               </h2>
//               <button 
//                 className="text-gray-400 hover:text-white transition-colors"
//                 onClick={() => setIsEditModalOpen(false)}
//               >
//                 <FaTimes />
//               </button>
//             </div>
//             <form onSubmit={handleUpdateTokens} className="p-4">
//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-emerald-300 mb-1">
//                   Hugging Face Token
//                 </label>
//                 <input
//                   type="text"
//                   name="huggingface_token"
//                   value={formData.huggingface_token}
//                   onChange={handleInputChange}
//                   className="w-full px-3 py-2 bg-black/50 border border-emerald-900/50 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
//                 />
//               </div>
//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-emerald-300 mb-1">
//                   Gemini Token
//                 </label>
//                 <input
//                   type="text"
//                   name="gemini_token"
//                   value={formData.gemini_token}
//                   onChange={handleInputChange}
//                   className="w-full px-3 py-2 bg-black/50 border border-emerald-900/50 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
//                 />
//               </div>
//               <div className="flex justify-end">
//                 <button
//                   type="button"
//                   className="mr-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition-colors"
//                   onClick={() => setIsEditModalOpen(false)}
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="px-4 py-2 bg-gradient-to-r from-blue-600/90 to-emerald-600/80 text-white rounded-md flex items-center transition-colors shadow-md"
//                   disabled={loading}
//                 >
//                   {loading ? (
//                     <>
//                       <div className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></div>
//                       Saving...
//                     </>
//                   ) : (
//                     <>
//                       <FaSave className="mr-2" /> Save
//                     </>
//                   )}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* Module Permissions Modal */}
//       {isModulePermissionsModalOpen && currentUser && (
//         <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
//           <div className="bg-gradient-to-br from-gray-900 to-black rounded-lg max-w-md w-full shadow-2xl border border-emerald-900/30">
//             <div className="flex justify-between items-center border-b border-gray-800 p-4">
//               <h2 className="text-xl font-semibold text-emerald-400">
//                 Module Permissions - {currentUser.username}
//               </h2>
//               <button 
//                 className="text-gray-400 hover:text-white transition-colors"
//                 onClick={() => setIsModulePermissionsModalOpen(false)}
//               >
//                 <FaTimes />
//               </button>
//             </div>
//             <div className="p-4">
//               <p className="text-sm text-gray-300 mb-4">
//                 Enable or disable access to specific modules for this user.
//               </p>

//               <div className="space-y-3 mb-6">
//                 {availableModules.map(module => (
//                   <div 
//                     key={module.id} 
//                     className="flex items-center justify-between p-3 bg-black/30 border border-emerald-900/30 rounded-lg"
//                   >
//                     <span className="text-white">{module.name}</span>
//                     <button
//                       type="button"
//                       onClick={() => toggleModulePermission(module.id)}
//                       className={`px-3 py-1.5 rounded-lg flex items-center space-x-2 
//                         ${modulePermissions[module.id] 
//                           ? 'bg-red-600/20 text-red-300 hover:bg-red-600/40' 
//                           : 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/40'} 
//                         transition-colors`}
//                     >
//                       {modulePermissions[module.id] ? (
//                         <>
//                           <FaLock className="mr-1" /> Disabled
//                         </>
//                       ) : (
//                         <>
//                           <FaUnlock className="mr-1" /> Enabled
//                         </>
//                       )}
//                     </button>
//                   </div>
//                 ))}
//               </div>

//               <div className="flex justify-end">
//                 <button
//                   type="button"
//                   className="mr-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition-colors"
//                   onClick={() => setIsModulePermissionsModalOpen(false)}
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="button"
//                   onClick={handleUpdateModulePermissions}
//                   className="px-4 py-2 bg-gradient-to-r from-blue-600/90 to-emerald-600/80 text-white rounded-md flex items-center transition-colors shadow-md"
//                   disabled={loading}
//                 >
//                   {loading ? (
//                     <>
//                       <div className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></div>
//                       Saving...
//                     </>
//                   ) : (
//                     <>
//                       <FaSave className="mr-2" /> Save
//                     </>
//                   )}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AdminPanel;

import React, { useState, useEffect } from 'react';
import { adminService } from '../utils/axiosConfig';
import { FaUserPlus, FaUserEdit, FaUserMinus, FaKey, FaSave, FaTimes, FaLock, FaUnlock } from 'react-icons/fa';
import Header from '../components/dashboard/Header';

// List of available modules to match the ones from projects page
const availableModules = [
  { id: "document-qa", name: "Document Q&A" },
  { id: "idea-generator", name: "Idea Generator" },
  { id: "topic-modeling", name: "Topic Modeling" },
  { id: "structured-data-query", name: "Structured Data Query" }
];
// Main Admin Panel Component
const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isModulePermissionsModalOpen, setIsModulePermissionsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    huggingface_token: '',
    gemini_token: '',
    llama_token: '' // Added Llama token field
  });

  // State for module permissions
  const [modulePermissions, setModulePermissions] = useState({});

  // Fetch all users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Function to fetch all users
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getAllUsers();
      setUsers(data);
    } catch (err) {
      setError('Failed to fetch users. Please try again.');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Open edit modal with user data
  const handleOpenEditModal = (user) => {
    setCurrentUser(user);
    setFormData({
      huggingface_token: user.api_tokens.huggingface_token || '',
      gemini_token: user.api_tokens.gemini_token || '',
      llama_token: user.api_tokens.llama_token || '' // Initialize Llama token
    });
    setIsEditModalOpen(true);
  };

  // Open module permissions modal
  const handleOpenModulePermissionsModal = (user) => {
    setCurrentUser(user);
    // Initialize module permissions with the user's current settings
    setModulePermissions(user.disabled_modules || {});
    setIsModulePermissionsModalOpen(true);
  };

  // Toggle module permission for a user
  const toggleModulePermission = (moduleId) => {
    setModulePermissions(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  // Handle form submission for new user
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminService.createUser(formData);
      setIsAddModalOpen(false);
      setFormData({
        username: '',
        email: '',
        password: '',
        huggingface_token: '',
        gemini_token: '',
        llama_token: '' // Reset Llama token
      });
      fetchUsers();
    } catch (err) {
      setError('Failed to create user. Please try again.');
      console.error('Error creating user:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission for updating user tokens
  const handleUpdateTokens = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminService.updateUserTokens(currentUser.id, {
        huggingface_token: formData.huggingface_token,
        gemini_token: formData.gemini_token,
        llama_token: formData.llama_token // Include Llama token in update
      });
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (err) {
      setError('Failed to update user tokens. Please try again.');
      console.error('Error updating tokens:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle updating module permissions
  const handleUpdateModulePermissions = async () => {
    setLoading(true);
    try {
      await adminService.updateUserModulePermissions(currentUser.id, {
        disabled_modules: modulePermissions
      });
      setIsModulePermissionsModalOpen(false);
      
      // Update the local users state to reflect the changes
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === currentUser.id 
            ? { ...user, disabled_modules: modulePermissions } 
            : user
        )
      );
    } catch (err) {
      setError('Failed to update module permissions. Please try again.');
      console.error('Error updating module permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId, username) => {
    if (window.confirm(`Are you sure you want to delete user "${username}"?`)) {
      setLoading(true);
      try {
        await adminService.deleteUser(userId);
        fetchUsers();
      } catch (err) {
        setError('Failed to delete user. Please try again.');
        console.error('Error deleting user:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-black to-emerald-900 min-h-screen text-white p-6">
      <Header/>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 mt-14">
          <h1 className="text-3xl font-bold text-emerald-400">Admin Panel - User Management</h1>
          <button 
            className="bg-gradient-to-r from-blue-600/90 to-emerald-600/80 text-white px-4 py-2 rounded-md flex items-center shadow-lg transition-all"
            onClick={() => setIsAddModalOpen(true)}
          >
            <FaUserPlus className="mr-2" /> Add New User
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/80 text-white p-4 mb-6 rounded-md shadow-lg">
            {error}
          </div>
        )}

        {/* Users Table */}
        <div className="bg-black/50 backdrop-blur-sm rounded-lg shadow-xl overflow-hidden border border-emerald-900/50">
          <table className="w-full divide-y divide-gray-800/50">
            <thead className="bg-black/70">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">API Keys</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">Module Permissions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-emerald-900/20 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <div className="flex flex-col">
                      <span>
                        <span className="text-blue-400">Hugging Face:</span> 
                        {user.api_tokens.huggingface_token ? 
                          `${user.api_tokens.huggingface_token.slice(0, 5)}...` : 
                          'Not set'
                        }
                      </span>
                      <span>
                        <span className="text-emerald-400">Gemini:</span> 
                        {user.api_tokens.gemini_token ? 
                          `${user.api_tokens.gemini_token.slice(0, 5)}...` : 
                          'Not set'
                        }
                      </span>
                      <span>
                        <span className="text-amber-400">Llama:</span> 
                        {user.api_tokens.llama_token ? 
                          `${user.api_tokens.llama_token.slice(0, 5)}...` : 
                          'Not set'
                        }
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    <div className="flex flex-col">
                      {user.disabled_modules ? 
                        Object.entries(user.disabled_modules)
                          .filter(([_, isDisabled]) => isDisabled)
                          .map(([moduleId]) => {
                            const module = availableModules.find(m => m.id === moduleId);
                            return module ? (
                              <span key={moduleId} className="text-red-400 flex items-center">
                                <FaLock className="mr-1" size={12} /> {module.name}
                              </span>
                            ) : null;
                          }) 
                        : 'All modules enabled'
                      }
                      {user.disabled_modules && 
                        Object.values(user.disabled_modules).filter(Boolean).length === 0 && 
                        'All modules enabled'
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-3">
                      <button 
                        className="text-blue-400 hover:text-emerald-300 transition-colors"
                        onClick={() => handleOpenEditModal(user)}
                        title="Edit API Tokens"
                      >
                        <FaKey size={16} />
                      </button>
                      <button 
                        className="text-purple-400 hover:text-purple-300 transition-colors"
                        onClick={() => handleOpenModulePermissionsModal(user)}
                        title="Edit Module Permissions"
                      >
                        <FaLock size={16} />
                      </button>
                      <button 
                        className="text-red-500 hover:text-red-400 transition-colors"
                        onClick={() => handleDeleteUser(user.id, user.username)}
                        title="Delete User"
                        disabled={user.username === 'admin'}
                      >
                        <FaUserMinus size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-400">
                    No users found
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-emerald-400"></div>
                      <span className="ml-2 text-emerald-300">Loading...</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-lg max-w-md w-full shadow-2xl border border-emerald-900/30">
            <div className="flex justify-between items-center border-b border-gray-800 p-4">
              <h2 className="text-xl font-semibold text-emerald-400">Add New User</h2>
              <button 
                className="text-gray-400 hover:text-white transition-colors"
                onClick={() => setIsAddModalOpen(false)}
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-emerald-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-black/50 border border-emerald-900/50 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-emerald-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-black/50 border border-emerald-900/50 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-emerald-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-black/50 border border-emerald-900/50 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-emerald-300 mb-1">
                  Hugging Face Token
                </label>
                <input
                  type="text"
                  name="huggingface_token"
                  value={formData.huggingface_token}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-black/50 border border-emerald-900/50 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-emerald-300 mb-1">
                  Gemini Token
                </label>
                <input
                  type="text"
                  name="gemini_token"
                  value={formData.gemini_token}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-black/50 border border-emerald-900/50 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-emerald-300 mb-1">
                  Llama Token
                </label>
                <input
                  type="text"
                  name="llama_token"
                  value={formData.llama_token}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-black/50 border border-emerald-900/50 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="mr-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition-colors"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600/90 to-emerald-600/80 text-white rounded-md flex items-center transition-colors shadow-md"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2" /> Save
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && currentUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-lg max-w-md w-full shadow-2xl border border-emerald-900/30">
            <div className="flex justify-between items-center border-b border-gray-800 p-4">
              <h2 className="text-xl font-semibold text-emerald-400">
                Edit API Tokens - {currentUser.username}
              </h2>
              <button 
                className="text-gray-400 hover:text-white transition-colors"
                onClick={() => setIsEditModalOpen(false)}
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleUpdateTokens} className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-emerald-300 mb-1">
                  Hugging Face Token
                </label>
                <input
                  type="text"
                  name="huggingface_token"
                  value={formData.huggingface_token}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-black/50 border border-emerald-900/50 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-emerald-300 mb-1">
                  Gemini Token
                </label>
                <input
                  type="text"
                  name="gemini_token"
                  value={formData.gemini_token}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-black/50 border border-emerald-900/50 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-emerald-300 mb-1">
                  Llama Token
                </label>
                <input
                  type="text"
                  name="llama_token"
                  value={formData.llama_token}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-black/50 border border-emerald-900/50 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="mr-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition-colors"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600/90 to-emerald-600/80 text-white rounded-md flex items-center transition-colors shadow-md"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2" /> Save
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Module Permissions Modal */}
      {isModulePermissionsModalOpen && currentUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-lg max-w-md w-full shadow-2xl border border-emerald-900/30">
            <div className="flex justify-between items-center border-b border-gray-800 p-4">
              <h2 className="text-xl font-semibold text-emerald-400">
                Module Permissions - {currentUser.username}
              </h2>
              <button 
                className="text-gray-400 hover:text-white transition-colors"
                onClick={() => setIsModulePermissionsModalOpen(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-300 mb-4">
                Enable or disable access to specific modules for this user.
              </p>

              <div className="space-y-3 mb-6">
                {availableModules.map(module => (
                  <div 
                    key={module.id} 
                    className="flex items-center justify-between p-3 bg-black/30 border border-emerald-900/30 rounded-lg"
                  >
                    <span className="text-white">{module.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleModulePermission(module.id)}
                      className={`px-3 py-1.5 rounded-lg flex items-center space-x-2 
                        ${modulePermissions[module.id] 
                          ? 'bg-red-600/20 text-red-300 hover:bg-red-600/40' 
                          : 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/40'} 
                        transition-colors`}
                    >
                      {modulePermissions[module.id] ? (
                        <>
                          <FaLock className="mr-1" /> Disabled
                        </>
                      ) : (
                        <>
                          <FaUnlock className="mr-1" /> Enabled
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  className="mr-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition-colors"
                  onClick={() => setIsModulePermissionsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateModulePermissions}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600/90 to-emerald-600/80 text-white rounded-md flex items-center transition-colors shadow-md"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2" /> Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;