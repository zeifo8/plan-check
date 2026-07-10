// Трёхмерное представление проектного плана

function renderThreeViewIfNeeded() {
  if (state.activeView === "three") {
    renderThreeView();
  }
}

function renderThreeView() {
  if (!ui.threeContainer || typeof THREE === "undefined") return;

  const tasks = state.project.tasks.filter(hasValidPeriod);

  if (!tasks.length) {
    clearThree();
    ui.threeContainer.innerHTML = "";
    ui.threeTaskInfo.className = "three-task-info empty-box";
    ui.threeTaskInfo.textContent = "Нет задач с корректными датами.";
    return;
  }

  clearThree();

  const size = sceneSize();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1020);

  const camera = new THREE.PerspectiveCamera(50, size.width / size.height, 0.1, 3000);
  camera.position.set(260, 210, 260);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(size.width, size.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  ui.threeContainer.innerHTML = "";
  ui.threeContainer.appendChild(renderer.domElement);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.set(80, 35, 28);

  scene.add(new THREE.AmbientLight(0xffffff, 0.75));

  const light = new THREE.DirectionalLight(0xffffff, 0.85);
  light.position.set(120, 180, 80);
  scene.add(light);

  drawThreeScene(scene, tasks, renderer.domElement, camera);

  Object.assign(three, { scene, camera, renderer, controls });

  const animate = () => {
    three.frame = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };

  animate();
}

function drawThreeScene(scene, tasks, canvas, camera) {
  const { minDate, maxDate } = projectRange(tasks);
  const totalDays = Math.max(1, daysBetween(minDate, maxDate) + 1);
  const assignees = unique(tasks.map((task) => task.assignee || "Без ответственного"));
  const orderedTasks = [...tasks].sort((a, b) => Number(a.id) - Number(b.id));

  const scale = { x: 18, y: 26, z: 16 };
  const max = {
    x: totalDays * scale.x,
    y: assignees.length * scale.y + 18,
    z: orderedTasks.length * scale.z + 12
  };

  drawGrid(scene, max, scale);
  drawAxes(scene, max);
  drawAxisLabels(scene, max);

  assignees.forEach((assignee, index) => {
    addText(scene, assignee, -22, index * scale.y + 18, 0, "#e5edff");
  });

  const step = Math.max(1, Math.ceil(totalDays / 8));
  for (let day = 0; day < totalDays; day += step) {
    addText(scene, formatDay(addDays(minDate, day)), day * scale.x, -18, 0, "#cbd5e1");
  }

  const conflicts = new Set(findAssigneeOverlaps(state.project.tasks).flatMap((item) => [String(item.a.id), String(item.b.id)]));

  orderedTasks.forEach((task, taskIndex) => {
    const mesh = makeTaskBox(task, taskIndex, assignees, minDate, scale, conflicts.has(String(task.id)));
    scene.add(mesh);
    three.taskMeshes.push(mesh);

    if (mesh.userData.hasConflict) {
      const edges = new THREE.EdgesGeometry(mesh.geometry);
      const outline = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xff3333 }));
      outline.position.copy(mesh.position);
      scene.add(outline);
    }

    addText(scene, String(task.id), mesh.position.x, mesh.position.y + 10, mesh.position.z, "#ffffff");
  });

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();

    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const hit = raycaster.intersectObjects(three.taskMeshes)[0];

    if (hit) {
      renderTaskCard(hit.object.userData.task, hit.object.userData.hasConflict);
    }
  });
}

function makeTaskBox(task, taskIndex, assignees, minDate, scale, hasConflict) {
  const start = parseDate(task.start_date);
  const end = parseDate(task.end_date);
  const duration = Math.max(1, daysBetween(start, end) + 1);
  const assigneeIndex = Math.max(0, assignees.indexOf(task.assignee || "Без ответственного"));

  const geometry = new THREE.BoxGeometry(Math.max(8, duration * scale.x - 2), 10, 8);
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(taskColor(task.category)),
    roughness: 0.52,
    metalness: 0.08
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(
    daysBetween(minDate, start) * scale.x + (duration * scale.x) / 2,
    assigneeIndex * scale.y + 18,
    taskIndex * scale.z + 10
  );

  mesh.userData = { task, hasConflict };
  return mesh;
}

function drawGrid(scene, max, scale) {
  for (let x = 0; x <= max.x + 0.1; x += scale.x) {
    line(scene, [x, 0, 0], [x, max.y, 0], 0x1e293b);
    line(scene, [x, 0, 0], [x, 0, max.z], 0x1e293b);
  }

  for (let y = 0; y <= max.y + 0.1; y += scale.y) {
    line(scene, [0, y, 0], [max.x, y, 0], 0x1e293b);
  }

  for (let z = 0; z <= max.z + 0.1; z += scale.z) {
    line(scene, [0, 0, z], [max.x, 0, z], 0x1e293b);
  }

  line(scene, [0, 0, 0], [0, max.y, 0], 0x334155);
  line(scene, [0, max.y, 0], [max.x, max.y, 0], 0x334155);
  line(scene, [max.x, 0, 0], [max.x, max.y, 0], 0x334155);
  line(scene, [0, 0, max.z], [max.x, 0, max.z], 0x334155);
  line(scene, [max.x, 0, 0], [max.x, 0, max.z], 0x334155);
}

function drawAxes(scene, max) {
  line(scene, [0, 0, 0], [max.x + 35, 0, 0], 0x60a5fa);
  line(scene, [0, 0, 0], [0, max.y + 28, 0], 0x34d399);
  line(scene, [0, 0, 0], [0, 0, max.z + 24], 0xa78bfa);
}

function drawAxisLabels(scene, max) {
  addText(scene, "X: время", max.x + 45, 0, 0, "#93c5fd");
  addText(scene, "Y: исполнители", 0, max.y + 38, 0, "#86efac");
  addText(scene, "Z: задачи", 0, 0, max.z + 34, "#c4b5fd");
}

function line(scene, from, to, color) {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(...from),
    new THREE.Vector3(...to)
  ]);

  scene.add(new THREE.Line(geometry, new THREE.LineBasicMaterial({ color })));
}

function addText(scene, text, x, y, z, color) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = 512;
  canvas.height = 128;

  ctx.font = "700 38px Inter, Arial, sans-serif";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(canvas),
    transparent: true
  }));

  sprite.position.set(x, y, z);
  sprite.scale.set(42, 10, 1);
  scene.add(sprite);
}

function renderTaskCard(task, hasConflict) {
  ui.threeTaskInfo.className = "three-task-info";
  ui.threeTaskInfo.innerHTML = `
    <dl>
      <div><dt>Задача</dt><dd>${escapeHtml(task.text)}</dd></div>
      <div><dt>Период</dt><dd>${escapeHtml(task.start_date)} — ${escapeHtml(task.end_date)}</dd></div>
      <div><dt>Ответственный</dt><dd>${escapeHtml(task.assignee || "не указан")}</dd></div>
      <div><dt>Категория</dt><dd>${escapeHtml(task.category || "Другое")}</dd></div>
      <div><dt>Результат</dt><dd>${escapeHtml(task.deliverable || "не указан")}</dd></div>
      <div><dt>Конфликт</dt><dd>${hasConflict ? "Есть пересечение по загрузке" : "Не найден"}</dd></div>
    </dl>
  `;
}

function clearThree() {
  if (three.frame) cancelAnimationFrame(three.frame);
  if (three.controls) three.controls.dispose();

  if (three.renderer) {
    const canvas = three.renderer.domElement;
    three.renderer.dispose();
    if (canvas?.parentNode) canvas.parentNode.removeChild(canvas);
  }

  Object.assign(three, {
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    taskMeshes: [],
    frame: null
  });
}
