<template>
  <div class="blog">
    <router-view />
    <router-link to="/blog" tag="a" class="back">&laquo; Back</router-link>
  </div>
</template>
<style lang="scss" scoped>
.blog {
  max-width: 50vw;
  margin: 10rem auto;

  .back {
    background-color: #42b883;
    color: white;
    margin-top: 5rem;
    text-decoration: none;
    padding: 10px 15px;
    border: 1px solid currentColor;
    border-radius: .5rem;
    display: inline-block;
    transition: all .3s ease;
    &:hover {
      background-color: transparent;
      color: #42b883;
    }
  }
  /deep/ {
    h3 {
      color: rgba(2, 2, 61, 0.95);
      font-family:  Helvetica, sans-serif;
      font-style: normal;
      font-weight: 100;
      font-size: 30px;
    }

    p {
      font-size: 18px;
      font-family:  Helvetica Neue, sans-serif;
      margin-top: .4rem;
      margin-bottom: 4rem;
    }

    h1 {
      font-size: 3rem;
      margin-bottom: .2rem;
      color: #42b883;
    }
    h4 {
      margin-bottom: 3rem;
      color: #35495e;
    }
    pre {
      overflow-x: auto;
      background-color: #35495e;
      color: white;
      border-radius: .3rem;
      padding: 1rem;
    }
    img {
      max-width: 100%;
    }
  }
}
</style>
