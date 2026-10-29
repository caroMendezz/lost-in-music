
import React from 'react';

import Header from '../components/header';
import OtherUserProfile from '../components/OtherUserProfile';
import Footer from '../components/footer';

import '../styles/userProfilePage.css';

function UserOtherProfilePage() {
  return (
    <div className="user-profile-page">
      <Header />

      <div className="user-profile-page-content">
        <OtherUserProfile />
      </div>

      <Footer />
    </div>
  );
}

export default UserOtherProfilePage;
