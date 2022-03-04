import React from 'react'
import { Link } from 'react-router-dom'
import Slider from '../components/Slider'
import rentCategoryImage from '../assets/jpg/rentCategoryImage.jpg'
import sellCategoryImage from '../assets/jpg/sellCategoryImage.jpg'

function Explore() {

  // console.log(process.env.REACT_APP_GEOCODE_API_KEY);

  return (
    <div className='explore'>
        <p className="pageHeader">
          Explore
        </p>
        <main>
          <Slider />
          <p className="exploreCategoryHeading">Categories</p>
          <div className="exploreCategories">
            <Link to='/category/rent'>
              <img src={rentCategoryImage} alt="rent" className='exploreCategoryImg'/>
              <p className="exploreCategoryName">Places for Rent</p>
            </Link>
            <Link to='/category/sale'>
              <img src={sellCategoryImage} alt="sell" className='exploreCategoryImg'/>
              <p className="exploreCategoryName">Places for Sale</p>
            </Link>
          </div>
        </main>
    </div>
  )
}

export default Explore