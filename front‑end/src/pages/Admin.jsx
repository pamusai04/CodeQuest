import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { NavLink } from 'react-router';
import axiosClient from '../utils/axiosClient';

function Admin() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const response = await axiosClient.get('/problem/getAllProblem');
        setProblems(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching problems:', error);
        setLoading(false);
      }
    };

    fetchProblems();
  }, []);

  const adminOptions = [
    {
      id: 'create',
      title: 'Create Problem',
      description: 'Add a new coding problem to the platform',
      icon: Plus,
      color: 'btn-success',
      bgColor: 'bg-success/10',
      route: '/admin/create'
    },
    {
      id: 'update',
      title: 'Problems List',
      description: 'View and edit existing problems',
      icon: Edit,
      color: 'btn-warning',
      bgColor: 'bg-warning/10',
      route: null
    },
    {
      id: 'delete',
      title: 'Delete Problem',
      description: 'Remove problems from the platform',
      icon: Trash2,
      color: 'btn-error',
      bgColor: 'bg-error/10',
      route: '/admin/delete'
    }
  ];

  const handleOptionClick = (option) => {
    if (option.route) {
      setSelectedOption(null);
    } else {
      setSelectedOption(option.id);
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-base-content mb-4">
            Admin Panel
          </h1>
          <p className="text-base-content/70 text-lg">
            Manage coding problems on your platform
          </p>
        </div>

        {/* Admin Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
          {adminOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <div
                key={option.id}
                className={`card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer ${selectedOption === option.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => handleOptionClick(option)}
              >
                <div className="card-body items-center text-center p-8">
                  {/* Icon */}
                  <div className={`${option.bgColor} p-4 rounded-full mb-4`}>
                    <IconComponent size={32} className="text-base-content" />
                  </div>
                  
                  {/* Title */}
                  <h2 className="card-title text-xl mb-2">
                    {option.title}
                  </h2>
                  
                  {/* Description */}
                  <p className="text-base-content/70 mb-6">
                    {option.description}
                  </p>
                  
                  {/* Action Button */}
                  <div className="card-actions">
                    {option.route ? (
                      <NavLink 
                        to={option.route}
                        className={`btn ${option.color} btn-wide`}
                      >
                        {option.title}
                      </NavLink>
                    ) : (
                      <button className={`btn ${option.color} btn-wide`}>
                        {option.title}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Problems List (shown when "Problems List" is selected) */}
        {selectedOption === 'update' && (
          <div className="bg-base-100 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">All Problems</h2>
            
            {loading ? (
              <div className="flex justify-center">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Difficulty</th>
                      <th>Tags</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {problems.map((problem) => (
                      <tr key={problem._id}>
                        <td>{problem.title}</td>
                        <td>
                          <span className={`badge ${
                            problem.difficulty === 'easy' ? 'badge-success' :
                            problem.difficulty === 'medium' ? 'badge-warning' : 'badge-error'
                          }`}>
                            {problem.difficulty}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-info">
                            {problem.tags}
                          </span>
                        </td>
                        <td>
                          <NavLink
                            to={`/admin/update/${problem._id}`}
                            className="btn btn-sm btn-warning mr-2"
                          >
                            <Edit size={16} className="mr-1" />
                            Update
                          </NavLink>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;