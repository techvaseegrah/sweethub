import React, { useState } from 'react';
import axios from '../../../api/axios';

const DEPARTMENT_URL = '/admin/departments';

function CreateDepartment({ baseUrl = '/admin' }) {
  const DEPARTMENT_URL = `${baseUrl}/departments`;
  const [departmentName, setDepartmentName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      await axios.post(
        DEPARTMENT_URL,
        JSON.stringify({ name: departmentName }),
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );
      setMessage(`Department "${departmentName}" created successfully!`);
      setDepartmentName('');
    } catch (err) {
      if (!err?.response) {
        setError('No Server Response');
      } else {
        setError('Failed to create department. Please check the form data.');
      }
      console.error(err);
    }
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg">
     <h3 className="text-xl md:text-2xl font-semibold mb-4 text-gray-800">Create New Department</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="departmentName">
            Department Name
          </label>
          <input
            type="text"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="departmentName"
            value={departmentName}
            onChange={(e) => setDepartmentName(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full sm:w-auto bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Add Department
        </button>
      </form>
      {message && <p className="mt-4 text-green-500">{message}</p>}
      {error && <p className="mt-4 text-red-500">{error}</p>}
    </div>
  );
}

export default CreateDepartment;