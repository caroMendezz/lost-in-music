import React from 'react';

import Header from '../components/header';
import OtherUserProfileAdmin from '../components/OtherUserProfileAdmin';
import Footer from '../components/footer';

import '../styles/userProfilePage.css';

function OtherUserProfilePageAdmin() {
  return (
    <div className="user-profile-page">
      <Header />

      <div className="user-profile-page-content">
        <OtherUserProfileAdmin />
      </div>

      <Footer />
    </div>
  );
}

export default OtherUserProfilePageAdmin;