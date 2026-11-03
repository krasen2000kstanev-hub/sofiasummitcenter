// Rotating 3D album sphere on /galeriya/, moved from the old homepage.
(function(){
  var stage = document.querySelector('.gallery-orbit-stage');
  var sphere = document.getElementById('gallery-orbit-sphere');
  if (!stage || !sphere) return;
  var originals = Array.prototype.slice.call(sphere.children);
  var cards = originals.slice();
  originals.forEach(function(card){
    var copy = card.cloneNode(true);
    copy.setAttribute('aria-hidden','true');
    copy.setAttribute('tabindex','-1');
    sphere.appendChild(copy);
    cards.push(copy);
    var secondCopy = card.cloneNode(true);
    secondCopy.setAttribute('aria-hidden','true');
    secondCopy.setAttribute('tabindex','-1');
    sphere.appendChild(secondCopy);
    cards.push(secondCopy);
  });
  var radius = window.innerWidth < 768 ? 210 : 360;
  cards.forEach(function(card, index){
    var phi = Math.acos(1 - (2 * (index + .5)) / cards.length);
    var theta = Math.PI * (1 + Math.sqrt(5)) * index;
    var x = radius * Math.cos(theta) * Math.sin(phi);
    var y = radius * Math.sin(theta) * Math.sin(phi);
    var z = radius * Math.cos(phi);
    var rotY = Math.atan2(x, z) * 180 / Math.PI;
    var rotX = Math.asin(-y / radius) * 180 / Math.PI;
    card.style.transform = 'translate3d(' + x + 'px,' + y + 'px,' + z + 'px) rotateY(' + rotY + 'deg) rotateX(' + rotX + 'deg)';
  });
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var ticking = false;
  var animationFrame = 0;
  var scrollPitch = 0;
  var scrollYaw = 0;
  var displayedPitch = 0;
  var displayedYaw = 0;
  var lastScrollY = window.scrollY;
  var scrollMomentum = 0;
  var manualX = 0;
  var manualY = 0;
  var dragging = false;
  var pointerDown = false;
  var dragPointerId = null;
  var dragStartX = 0;
  var dragStartY = 0;
  var lastX = 0;
  var lastY = 0;
  function update(){
    var bounds = stage.getBoundingClientRect();
    var travel = Math.max(1, stage.offsetHeight - window.innerHeight);
    var progress = Math.max(0, Math.min(1, -bounds.top / travel));
    var scrollDelta = window.scrollY - lastScrollY;
    lastScrollY = window.scrollY;
    scrollMomentum = Math.max(-2.8, Math.min(2.8, scrollMomentum + scrollDelta * .006));
    scrollPitch = progress * 14;
    scrollYaw = progress * 360;
    ticking = false;
    if (!animationFrame) animationFrame = window.requestAnimationFrame(animate);
  }
  function animate(){
    var targetPitch = scrollPitch + manualY;
    var targetYaw = scrollYaw + manualX;
    displayedPitch += (targetPitch - displayedPitch) * .14;
    displayedYaw += (targetYaw - displayedYaw) * .14;
    displayedYaw += scrollMomentum;
    scrollMomentum *= .9;
    sphere.style.transform = 'rotateX(' + displayedPitch + 'deg) rotateY(' + displayedYaw + 'deg)';
    if (Math.abs(targetPitch - displayedPitch) > .05 || Math.abs(targetYaw - displayedYaw) > .05 || Math.abs(scrollMomentum) > .05) {
      animationFrame = window.requestAnimationFrame(animate);
    } else {
      animationFrame = 0;
    }
  }
  window.addEventListener('scroll', function(){
    if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
  }, {passive:true});
  sphere.addEventListener('pointerdown', function(e){
    pointerDown = true;
    dragPointerId = e.pointerId;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    lastX = e.clientX;
    lastY = e.clientY;
  });
  sphere.addEventListener('pointermove', function(e){
    if (!pointerDown || e.pointerId !== dragPointerId) return;
    if (!dragging) {
      var distance = Math.hypot(e.clientX - dragStartX, e.clientY - dragStartY);
      if (distance < 6) return;
      dragging = true;
      sphere.classList.add('is-dragging');
      sphere.setPointerCapture(e.pointerId);
    }
    manualX += (e.clientX - lastX) * .72;
    manualY -= (e.clientY - lastY) * .38;
    lastX = e.clientX;
    lastY = e.clientY;
    update();
  });
  function stopDragging(e){
    pointerDown = false;
    dragging = false;
    sphere.classList.remove('is-dragging');
    if (e && sphere.hasPointerCapture(e.pointerId)) sphere.releasePointerCapture(e.pointerId);
    dragPointerId = null;
  }
  sphere.addEventListener('pointerup', stopDragging);
  sphere.addEventListener('pointercancel', stopDragging);
  sphere.addEventListener('lostpointercapture', function(){
    pointerDown = false;
    dragging = false;
    sphere.classList.remove('is-dragging');
    dragPointerId = null;
  });
  window.addEventListener('resize', update);
  update();
}());
