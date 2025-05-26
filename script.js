document.addEventListener('DOMContentLoaded', () => {
  // --- Skill Card Typing Animation on Hover ---
  const skillCards = document.querySelectorAll('.skill-card-interactive');
  skillCards.forEach(card => {
    const originalText = card.textContent.trim();
    let typeInterval;
    // Store original text in a data attribute to prevent issues if script runs multiple times
    card.dataset.originalText = originalText;

    card.addEventListener('mouseenter', () => {
      const textToAnimate = card.dataset.originalText;
      card.textContent = ''; // Clear text
      let i = 0;
      if (card.dataset.typeIntervalId) {
        clearInterval(parseInt(card.dataset.typeIntervalId));
      }
      typeInterval = setInterval(() => {
        if (i < textToAnimate.length) {
          card.textContent += textToAnimate.charAt(i);
          i++;
        } else {
          clearInterval(typeInterval);
          card.dataset.typeIntervalId = '';
        }
      }, 80); // Adjusted typing speed
      card.dataset.typeIntervalId = typeInterval.toString();
    });

    card.addEventListener('mouseleave', () => {
      if (card.dataset.typeIntervalId) {
        clearInterval(parseInt(card.dataset.typeIntervalId));
        card.dataset.typeIntervalId = '';
      }
      card.textContent = card.dataset.originalText;
    });
  });

  // --- Theme Toggler ---
  const themeToggleButton = document.getElementById('theme-toggle-button');
  function updateThemeButtonText() {
    if (!themeToggleButton) return;
    if (document.body.classList.contains('light')) {
      themeToggleButton.textContent = ' Dark Mode';
    } else {
      themeToggleButton.textContent = ' Light Mode';
    }
  }

  if (themeToggleButton) {
    if (localStorage.getItem('theme') === 'light') {
      document.body.classList.add('light');
    }
    updateThemeButtonText(); 

    themeToggleButton.addEventListener('click', () => {
      document.body.classList.toggle('light');
      localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
      updateAnimationColors(); 
      updateThemeButtonText(); 
    });
  } else {
    console.warn('Theme toggle button not found.');
  }

  // --- Reverted & Intensified Circuit Board Background Animation ---
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) {
    console.warn('Canvas element with id "bgCanvas" not found.');
    return;
  }
  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  let computedStyles = getComputedStyle(document.documentElement);
  let particleColor = computedStyles.getPropertyValue('--accent').trim() || '#00f7ff';
  let traceColor = computedStyles.getPropertyValue('--accent-secondary').trim() || '#7f00ff';
  let nodeColor = computedStyles.getPropertyValue('--accent').trim() || '#00f7ff';

  const nodeCount = 80; // Can adjust for density
  const nodes = [];
  const particles = [];
  const particleCount = 200; // Increased for intensity
  let animationFrameId;

  function updateAnimationColors() {
    computedStyles = getComputedStyle(document.documentElement);
    particleColor = computedStyles.getPropertyValue('--accent').trim() || '#00f7ff';
    traceColor = computedStyles.getPropertyValue('--accent-secondary').trim() || '#7f00ff';
    nodeColor = computedStyles.getPropertyValue('--accent').trim() || '#00f7ff';
    // If starting in light mode and colors were just updated by adding .light class
    // we might need to re-init if initCircuit() depends on these values at creation time.
    // For now, initCircuit is called after first updateAnimationColors on load.
  }
  // Call once on load if light theme is set, to get correct initial colors
  if (document.body.classList.contains('light')) {
      updateAnimationColors();
  }


  class Node {
    constructor(x, y) {
      this.x = x || Math.random() * width;
      this.y = y || Math.random() * height;
      this.radius = Math.random() * 1.5 + 2; // "More little" nodes
      this.connections = [];
      this.pulseMaxRadius = this.radius + 2; // Smaller pulse range
      this.pulseSpeed = Math.random() * 0.03 + 0.02; // Faster pulse for "intense"
      this.currentPulseRadius = this.radius;
      this.pulseDirection = 1;
    }

    pulse() {
        this.currentPulseRadius += this.pulseSpeed * this.pulseDirection;
        if (this.currentPulseRadius >= this.pulseMaxRadius || this.currentPulseRadius <= this.radius) {
            this.pulseDirection *= -1;
        }
    }

    draw() {
      this.pulse();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.currentPulseRadius, 0, Math.PI * 2);
      ctx.fillStyle = nodeColor;
      ctx.globalAlpha = 0.4; // Slightly more visible pulse glow
      ctx.shadowBlur = 8; 
      ctx.shadowColor = nodeColor;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = nodeColor;
      ctx.fill();
    }
  }

  class Particle {
    constructor(sourceNode) {
      this.sourceNode = sourceNode;
      this.targetNode = nodes[Math.floor(Math.random() * nodes.length)];
      while (this.targetNode === this.sourceNode && nodes.length > 1) {
        this.targetNode = nodes[Math.floor(Math.random() * nodes.length)];
      }
      this.x = sourceNode.x;
      this.y = sourceNode.y;
      this.speed = Math.random() * 2.5 + 1.3; // "Intense" - faster particles
      this.radius = Math.random() * 1.2 + 0.8; // "More little" particles
      this.trail = [];
      this.trailLength = 5 + Math.random() * 8; // Shorter, more "intense" trails
      this.opacity = 0.7 + Math.random() * 0.3; 
    }

    update() {
      const dx = this.targetNode.x - this.x;
      const dy = this.targetNode.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.speed) {
        this.x = this.targetNode.x;
        this.y = this.targetNode.y;
        this.sourceNode = this.targetNode;
        // "Intense" burst effect
        if (Math.random() < 0.08 && particles.length < particleCount + 25) { 
            for(let i=0; i < Math.floor(Math.random()*2)+1; i++) particles.push(new Particle(this.sourceNode)); 
        }

        this.targetNode = nodes[Math.floor(Math.random() * nodes.length)];
        while (this.targetNode === this.sourceNode && nodes.length > 1) {
          this.targetNode = nodes[Math.floor(Math.random() * nodes.length)];
        }
        this.trail = [];
      } else {
        this.x += (dx / distance) * this.speed;
        this.y += (dy / distance) * this.speed;
      }

      this.trail.push({ x: this.x, y: this.y, opacity: this.opacity });
      if (this.trail.length > this.trailLength) {
        this.trail.shift();
      }
    }

    draw() {
      if (this.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(this.trail[0].x, this.trail[0].y);
        for (let i = 1; i < this.trail.length; i++) {
          const t = this.trail[i];
          ctx.lineTo(t.x, t.y);
        }
        ctx.strokeStyle = particleColor; 
        ctx.lineWidth = this.radius * 0.9; // Thinner trail
        
        for (let i = 0; i < this.trail.length; i++) {
            ctx.globalAlpha = (i / this.trail.length) * this.trail[i].opacity * 0.7; 
            if (i > 0) {
                ctx.beginPath();
                ctx.moveTo(this.trail[i-1].x, this.trail[i-1].y);
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
                ctx.stroke();
            }
        }
        ctx.globalAlpha = 1;
      }

      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = particleColor;
      ctx.globalAlpha = this.opacity;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function initCircuit() {
    nodes.length = 0;
    particles.length = 0;
    for (let i = 0; i < nodeCount; i++) {
      nodes.push(new Node());
    }

    nodes.forEach(node => {
      const connectionsToMake = Math.floor(Math.random() * 2) + 1; // 1 or 2 connections
      for (let i = 0; i < connectionsToMake; i++) {
        const targetNodeIndex = Math.floor(Math.random() * nodeCount);
        if (nodes[targetNodeIndex] !== node && !node.connections.includes(targetNodeIndex)) {
          node.connections.push(targetNodeIndex);
        }
      }
    });

    for (let i = 0; i < particleCount; i++) {
      const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
      if(randomNode) particles.push(new Particle(randomNode));
    }
  }

  function drawCircuitTraces() { // Renamed from drawTraces to avoid conflict if old code was merged
    ctx.strokeStyle = traceColor;
    ctx.lineWidth = 0.25; // "More little" - thinner traces
    ctx.globalAlpha = 0.1; // More faint static traces

    nodes.forEach(node => {
      node.connections.forEach(targetIndex => {
        const targetNode = nodes[targetIndex];
        if (targetNode) {
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          const cp1x = (node.x + targetNode.x) / 2 + (Math.random() - 0.5) * 30; // Reduced curve randomness
          const cp1y = (node.y + targetNode.y) / 2 + (Math.random() - 0.5) * 30;
          ctx.quadraticCurveTo(cp1x, cp1y, targetNode.x, targetNode.y);
          ctx.stroke();
        }
      });
    });
    ctx.globalAlpha = 1;
  }

  function animate() {
    animationFrameId = requestAnimationFrame(animate);
    ctx.clearRect(0, 0, width, height);

    drawCircuitTraces();
    nodes.forEach(node => node.draw());
    particles.forEach(p => {
      p.update();
      p.draw();
    });

    if (particles.length > particleCount + 30) { // Control particle population
        particles.splice(particleCount + 30, particles.length - (particleCount + 30));
    }
  }

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    updateAnimationColors();
    initCircuit(); 
  });

  // Initial setup
  updateAnimationColors(); // Ensure colors are set before first init
  initCircuit();
  animate();

  // --- Scroll-triggered background change (Intersection Observer approach) ---
  const sections = document.querySelectorAll('main > section');
  const observerOptions = {
    root: null, 
    rootMargin: '0px',
    threshold: 0.5 
  };

  const sectionObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // const sectionId = entry.target.id;
        // console.log(`Section ${sectionId} is in view.`);
        // Placeholder for future scroll-based animation changes
      }
    });
  }, observerOptions);

  sections.forEach(section => {
    sectionObserver.observe(section);
  });
});
