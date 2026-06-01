import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SkillExtraction = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect candidates straight to the integrated Resume page
    navigate('/resume-upload');
  }, [navigate]);

  return null;
};

export default SkillExtraction;
