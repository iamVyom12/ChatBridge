let slideIndex = 0;
const slides = document.querySelectorAll('.slide');

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.style.transform = `translateX(-${index * 100}%)`;
  });
}


function nextSlide() {
  slideIndex++;
  if (slideIndex >= slides.length) {
    slideIndex = 0;
  }
  showSlide(slideIndex);
}

function prevSlide() {
  slideIndex--;
  if (slideIndex < 0) {
    slideIndex = slides.length - 1;
  }
  showSlide(slideIndex);
}


// Change slide every 3 seconds
setInterval(nextSlide, 7000);

// About Us scrolling animation
window.addEventListener('scroll', function() {
  const aboutSection = document.querySelector('.about-us');
  const aboutContainer = document.querySelector('.about-container');
  const aboutSectionPosition = aboutSection.getBoundingClientRect().top;
  const screenPosition = window.innerHeight / 1.5;

  if (aboutSectionPosition < screenPosition) {
    aboutContainer.classList.add('about-visible');
  } else {
    aboutContainer.classList.remove('about-visible');
  }
});

//add event listener to the next and previous all buttons
document.querySelectorAll('.prevSlide').forEach(button => button.addEventListener('click', () => {
  prevSlide();
}));



document.querySelectorAll('.nextSlide').forEach(button => button.addEventListener('click', () => {
  nextSlide();
}));

