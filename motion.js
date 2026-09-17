(function(){
  function init(){
    var topButton=document.createElement('button');
    topButton.className='back-to-top';
    topButton.type='button';
    topButton.setAttribute('aria-label','Върни се в началото');
    topButton.innerHTML='↑';
    document.body.appendChild(topButton);
    function updateTopButton(){topButton.classList.toggle('is-visible',window.scrollY>420)}
    window.addEventListener('scroll',updateTopButton,{passive:true});
    topButton.addEventListener('click',function(){window.scrollTo({top:0,behavior:'smooth'});});
    updateTopButton();
    var sections=document.querySelectorAll('main > section, footer');
    sections.forEach(function(section,index){
      section.classList.add('motion-section');
      section.querySelectorAll('.sechead,.hero-photo,.space-card,.event-card,.fact,.event-tags span,.partner-card,.contact-grid > *,.form-wrap').forEach(function(item,i){
        item.classList.add('motion-item');
        item.style.setProperty('--motion-delay',Math.min(i*70,420)+'ms');
      });
    });
    if(!('IntersectionObserver' in window)){sections.forEach(function(s){s.classList.add('is-visible')});return;}
    var observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}})},{threshold:.12,rootMargin:'0px 0px -8% 0px'});
    sections.forEach(function(section){observer.observe(section)});
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init)}else{init()}
})();
