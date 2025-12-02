document.addEventListener('DOMContentLoaded', () => {
  const reviewsList = document.getElementById('reviewsList');
  const reviewModal = document.getElementById('reviewModal');
  const closeModal = reviewModal.querySelector('.close-btn');
  const modalTitle = document.getElementById('modalTitle');
  const modalThumb = document.getElementById('modalThumb');
  const modalAuthor = document.getElementById('modalAuthor');
  const autoScreenBtn = document.getElementById('autoScreenBtn');
  const approveBtn = document.getElementById('approveBtn');
  const rejectBtn = document.getElementById('rejectBtn');
  const rejectReason = document.getElementById('rejectReason');

  let reviews = [];
  let currentReview = null;

  async function fetchReviews() {
    const res = await fetch('/api/admin/reviews');
    reviews = await res.json();
    renderReviews();
  }

  function renderReviews() {
    reviewsList.innerHTML = '';
    reviews.forEach(r => {
      const card = document.createElement('div');
      card.className = 'review-card';
      card.innerHTML = `<img src="${r.thumb}" alt="${r.title}" style="width:100%; border-radius:8px;">
                        <h4>${r.title}</h4>
                        <p>作者：${r.author}</p>
                        <p>状态：${r.status}</p>`;
      card.addEventListener('click', () => openModal(r));
      reviewsList.appendChild(card);
    });
  }

  function openModal(review) {
    currentReview = review;
    modalTitle.textContent = `审核作品：${review.title}`;
    modalThumb.innerHTML = `<img src="${review.thumb}" alt="${review.title}" style="width:100%; border-radius:8px;">`;
    modalAuthor.textContent = review.author;
    rejectReason.classList.toggle('hidden', true);
    reviewModal.classList.remove('hidden');
  }

  closeModal.addEventListener('click', () => reviewModal.classList.add('hidden'));

  autoScreenBtn.addEventListener('click', async () => {
    await fetch(`/api/admin/reviews/${currentReview.id}/auto_screen`, { method: 'POST' });
    alert('自动初筛完成');
    fetchReviews();
  });

  approveBtn.addEventListener('click', async () => {
    await fetch(`/api/admin/reviews/${currentReview.id}/approve`, { method: 'POST' });
    alert('已通过');
    reviewModal.classList.add('hidden');
    fetchReviews();
  });

  rejectBtn.addEventListener('click', () => rejectReason.classList.toggle('hidden'));

  rejectReason.addEventListener('blur', async () => {
    if (rejectReason.value.trim()) {
      await fetch(`/api/admin/reviews/${currentReview.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason.value })
      });
      alert('已驳回');
      reviewModal.classList.add('hidden');
      fetchReviews();
    }
  });

  fetchReviews();
});
