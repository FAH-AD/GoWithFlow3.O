import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, Bell, MessageSquare, Settings, LogOut, User, Users, Briefcase, Shield, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { logout, fetchUserProfile } from "../redux/AuthSlice";

const Navbar = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.Auth.user);
  const isAuthenticated = !!user;
  const token = localStorage.getItem('authToken'); // Get token from localStorage

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  const navigate = useNavigate();
  const location = useLocation(); // Add this line to get the current location

  // Fetch user profile from API
  useEffect(() => {
    const fetchProfile = async () => {
      if (isAuthenticated && user?.role === 'client' && token) {
        console.log("Attempting to fetch profile with token:", token);
        try {
          const response = await fetch(`http://localhost:5000/api/user-profile/${user._id}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          setUserProfile(data.data.user);
          localStorage.setItem('userStatus', data.data.user.clientVerification.status); // Store profile in localStorage
        } catch (error) {
          console.error('Error fetching user profile:', error.message);
          // If the token is invalid, you might want to log the user out
          if (error.message.includes('401')) {
            console.log("Token seems to be invalid. Logging out.");
            handleLogout();
          }
        }
      }
    };

    fetchProfile();
  }, [isAuthenticated, user, token]);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;
      if (!target.closest(".profile-menu") && !target.closest(".profile-trigger")) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch, isAuthenticated]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleProfile = () => setIsProfileOpen(!isProfileOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const handleLogout = () => {
    console.log("logout is clicked")
    dispatch(logout());
    navigate('/');
    setIsProfileOpen(false);
  };

  // Navigation links based on user role
  const getNavLinks = () => {
    if (!isAuthenticated) {
      return [
        { name: "Home", href: "/" },
        { name: "About Us", href: "/about-us" },
        { name: "Find Talent", href: "/talent" },
        { name: "How It Works", href: "/how-it-works" },
      ];
    }

    switch (user?.role) {
      case "admin":
        return [
          { name: "Dashboard", href: "/admin" },
          { name: "Users", href: "/admin/users" },
          { name: "Verify Users", href: "/admin/verify-users" },
          { name: "Issues", href: "/admin/issues" },
          { name: "Reports", href: "/admin/reports" },
          { name: "Settings", href: "/admin/settings" },
        ];
      case "client":
        return [
          { name: "Dashboard", href: "/client" },
          { name: "Find Talent", href: "/client/search-freelancers" },
          { name: "My Jobs", href: "/client/my-jobs" },
          { name: "Messages", href: "/client/messages" },
          { name: "Support", href: "/client/support" },
        ];
      case "freelancer":
        return [
          { name: "Dashboard", href: "/freelancer" },
          { name: "Find Work", href: "/freelancer/search-job" },
          { name: "My Proposals", href: "/freelancer/my-proposals" },
          { name: "Hire Offers", href: "/freelancer/hire-offers" },
          { name: "Messages", href: "/freelancer/messages" },
          { name: "Support", href: "/freelancer/support" },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  const getVerificationStatus = () => {
    if (!isAuthenticated || user?.role !== 'client' || !userProfile) {
      return null;
    }

    const clientVerification = userProfile.clientVerification || {};


    switch (clientVerification.status) {
      case 'not-verified':
        return {
          text: 'Verify Your Company',
          icon: <Shield size={16} className="mr-2 text-yellow-500" />,
          action: () => navigate('/client/verify-company')
        };
      case 'pending':
        return {
          text: 'Verification Pending',
          icon: <Clock size={16} className="mr-2 text-blue-500" />
        };
      case 'verified':
        return {
          text: 'Company Verified',
          icon: <CheckCircle size={16} className="mr-2 text-green-500" />
        };
      case 'rejected':
        return {
          text: 'Verification Rejected',
          icon: <AlertCircle size={16} className="mr-2 text-red-500" />,
          action: () => navigate('/verify-company')
        };
      default:
        return null;
    }
  };

  const verificationStatus = getVerificationStatus();

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b border-[#2d2d3a] transition-all duration-200 ${isScrolled ? "bg-[#0a0a0f]/95 backdrop-blur" : "bg-[#0a0a0f]"
        }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-[#9333EA]"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path
              d="M8 12L11 15L16 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-xl font-bold text-[#9333EA]">GoWithFlow</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link, index) => (
            <Link
              key={index}
              to={link.href}
              className={`text-sm font-medium transition-colors ${
                location.pathname === link.href
                  ? "text-[#9333EA]" // Highlighted state
                  : "text-white hover:text-[#9333EA]" // Normal state
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Auth Buttons or User Profile */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              {/* Notification Icon - Only for logged in users */}
              {/* <button className="relative text-white hover:text-[#9333EA] transition-colors">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#9333EA] text-[10px] text-white">
                  3
                </span>
              </button> */}

              {/* Messages Icon - Only for logged in users */}

              {/* User Profile Dropdown */}
              <div className="relative">
                <button onClick={toggleProfile} className="profile-trigger flex items-center gap-2 focus:outline-none">
                  <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-[#9333EA]">
                    <img
                      src={
                        user?.profilePic ||
                        "https://res.cloudinary.com/dxmeatsae/image/upload/v1744198536/uploads/tep04pn8luh3bt2n24g6.png"}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-white">{user?.name}</span>
                  <ChevronDown size={16} className="text-white" />
                </button>

                {isProfileOpen && (
                  <div className="profile-menu absolute right-0 mt-2 w-56 rounded-md bg-[#121218] border border-[#2d2d3a] shadow-lg py-1 z-50">
                    <div className="px-4 py-3 border-b border-[#2d2d3a]">
                      <p className="text-sm text-white">{userProfile?.name || user?.name}</p>
                      <p className="text-xs text-gray-400 truncate">{userProfile?.email || user?.email}</p>
                      <div className="mt-2">
                        <span className="inline-flex items-center rounded-full bg-[#9333EA]/20 px-2 py-1 text-xs font-medium text-[#9333EA] capitalize">
                          {userProfile?.role || user?.role}
                        </span>
                      </div>
                    </div>

                    <Link
                      to={user?.role === 'client' ? `/client/profile/${user?._id}` : `/freelancer/profile/${user?._id}`}
                      className="flex items-center px-4 py-2 text-sm text-white hover:bg-[#2d2d3a] transition-colors"
                    >
                      <User size={16} className="mr-2" />
                      Profile
                    </Link>
                    <Link
                      to={user?.role === 'client' ? `/client/my-teams` : `/freelancer/my-teams`}
                      className="flex items-center px-4 py-2 text-sm text-white hover:bg-[#2d2d3a] transition-colors"
                    >
                      <Users size={16} className="mr-2" />
                      My Teams
                    </Link>
                     <Link
                      to={user?.role === 'client' ? `/client/my-teams` : `/freelancer/my-jobs`}
                      className="flex items-center px-4 py-2 text-sm text-white hover:bg-[#2d2d3a] transition-colors"
                    >
                      <Briefcase size={16} className="mr-2" />
                      My Jobs
                    </Link>

                    {verificationStatus && (
                      <button
                        onClick={verificationStatus.action}
                        className="w-full flex items-center px-4 py-2 text-sm text-white hover:bg-[#2d2d3a] transition-colors"
                      >
                        {verificationStatus.icon}
                        {verificationStatus.text}
                      </button>
                    )}

                    {/* Role switcher for demo purposes */}

                    <div className="border-t border-[#2d2d3a] mt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-sm text-white hover:bg-[#2d2d3a] transition-colors"
                      >
                        <LogOut size={16} className="mr-2" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-white hover:text-[#9333EA] transition-colors">
                Log in
              </Link>
              <Link
                to="/signup"
                className="rounded-md bg-[#9333EA] px-4 py-2 text-sm font-medium text-white hover:bg-[#a855f7] transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}

          {/* Mobile menu button */}
          <button onClick={toggleMenu} className="md:hidden text-white hover:text-[#9333EA] transition-colors">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#0a0a0f] border-t border-[#2d2d3a]">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link, index) => (
              <Link
                key={index}
                to={link.href}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  location.pathname === link.href
                    ? "bg-[#2d2d3a] text-[#9333EA]" // Highlighted state
                    : "text-white hover:bg-[#2d2d3a]" // Normal state
                }`}
                onClick={closeMenu}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;