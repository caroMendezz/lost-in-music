import React from 'react';

import Header from '../components/header';
import UserProfile from '../components/userProfile';
import Footer from '../components/footer';

import '../styles/userProfilePage.css';

function UserProfilePage() {
  return (
    <div className="user-profile-page">

      <Header />

      <div className="user-profile-page-content">
        <UserProfile />
      </div>

      <Footer />

    </div>
  );
}

export default UserProfilePage;