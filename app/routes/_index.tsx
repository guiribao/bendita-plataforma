import { LinksFunction, LoaderFunctionArgs, MetaFunction, redirect } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { authenticator } from '~/secure/authentication.server';

import siteStyle from '~/assets/css/site.css';
import { useEffect, useRef } from 'react';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: siteStyle },
];

export async function loader({ request }: LoaderFunctionArgs) {
  let usuario = await authenticator.isAuthenticated(request);

  return { usuario };
}

export default function Index() {
  let data = useLoaderData()
  let sliderRef = useRef(null);
  let sliderTextRef = useRef(null)
  const navigate = useNavigate();

  let initialMouse = 0;
  let slideMovementTotal = 0;
  let mouseIsDown = false;

  useEffect(() => {
    document.body.addEventListener("mouseup", handleUnpressSwipe)
    document.body.addEventListener("touchend", handleUnpressSwipe)
    document.body.addEventListener("mousemove", handleSliderSwipe)
    document.body.addEventListener("touchmove", handleSliderSwipe)

  }, [])

  function handlePressSwipe(event) {
    mouseIsDown = true;
    slideMovementTotal = 400 - 60 + 10;
    initialMouse = event.clientX || event.originalEvent.touches[0].pageX;
  };

  function handleUnpressSwipe(event) {
    if (!mouseIsDown)
      return;

    mouseIsDown = false;
    let currentMouse = event.clientX || event.changedTouches[0].pageX;
    let relativeMouse = currentMouse - initialMouse;

    if (relativeMouse < slideMovementTotal) {
      sliderTextRef.current.style.opacity = "1";
      sliderTextRef.current.innerHTML = "Associe-se";
      sliderRef.current.style.left = "-10px";
      
      return;
    }

    return navigate("/cadastro/basico")
  };

  function handleSliderSwipe(event) {
    if (!mouseIsDown)
      return;

    let currentMouse = event.clientX || event.originalEvent.touches[0].pageX;
    let relativeMouse = currentMouse - initialMouse;

    sliderTextRef.current.innerHTML = "Oba!";

    if (relativeMouse <= 0) {
      sliderRef.current.style.left = '-10px';
      return;
    }

    if (relativeMouse >= slideMovementTotal + 10) {
      sliderRef.current.style.left = slideMovementTotal + 'px';
      return;
    }

    sliderRef.current.style.left = relativeMouse - 10 + 'px';
  };

  return <main className='inicial'>
    <div className='overlay'></div>
    <section className='disclaimer'>
      <h2> Nulla bibendum</h2>
      <p> Donec imperdiet ultrices elit, a porttitor nulla lacinia quis. Nam quis hendrerit velit. Maecenas quis faucibus massa. Suspendisse vel bibendum libero. Quisque leo nibh, tempus et lectus non, sollicitudin porta augue.</p>
    </section>
    <section className='call-to-action'>
      <div id="button-background">
        <span className="slide-text" ref={sliderTextRef}>Associe-se</span>
        <div id="slider" ref={sliderRef} onMouseDown={handlePressSwipe} onTouchStart={handlePressSwipe} onMouseUp={handleUnpressSwipe} onTouchEnd={handleUnpressSwipe}>
          <i className="las la-arrow-right"></i>
        </div>
      </div>
    </section>
  </main>;
}
