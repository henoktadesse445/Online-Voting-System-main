import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import './Breadcrumb.css';

const Breadcrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Mapping of routes to readable names
  const breadcrumbNameMap = {
    '': 'Home',
    'Admin': 'Dashboard',
    'User': 'User Home',
    'Vote': 'Vote',
    'Edit': 'Edit Profile',
    'Voters': 'Manage Voters',
    'candidate': 'Candidates',
    'Candidate': 'Candidates',
    'AddCandidate': 'Add Candidate',
    'calendar': 'Calendar',
    'upcoming': 'Upcoming Elections',
    'BarChart': 'Bar Chart',
    'LineChart': 'Line Chart',
    'PieChart': 'Pie Chart',
    'Signup': 'Registration',
    'Login': 'Login',
    'AdminLogin': 'Admin Login',
  };

  return (
    <nav aria-label="breadcrumb" className="breadcrumb-container">
      <ol className="breadcrumb">
        <li className="breadcrumb-item">
          <Link to="/">Home</Link>
        </li>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const displayName = breadcrumbNameMap[value] || value;

          return isLast ? (
            <li key={to} className="breadcrumb-item active" aria-current="page">
              {displayName}
            </li>
          ) : (
            <li key={to} className="breadcrumb-item">
              <Link to={to}>{displayName}</Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;

