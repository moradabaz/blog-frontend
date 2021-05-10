<template>
  <b-container class="bv-example-row">
    <b-row align-h="center" align-v="center" class="justify-content-md-center">
      <b-col col lg="2"> <img alt="Vue logo" src="../assets/avatar.png"> </b-col>
      <h1 class="headline center">Trust Software, Not Humans</h1>
    </b-row>
    <br>
    <br>
    <br>
    <h3>A little bit about me</h3>
    <b-row>
      <p>
        Hi everyone, my name is Morad and I’m just another Software Engineer who likes to share content related to computer Science and coding stuff.
        I like to discover new things in the tech world, do some personal research in some fields and try new tools.
        In this website I post some of the things I discovered and experienced during my studies and current job. Being a programmer is not a big deal, maybe in the past you needed a degree to start to get the necessary skill, but now with technology and the internet, there a lot of free bootcamps and courses where you can start learning from scratch.
        In this website I post stuff that I hope it’s helpful to some of you, especially if you are in college or you want to enter this programmer community.
        <br>
        <br>
        <strong>Why did I decide to choose the coding path?</strong>
        <br>
        Well, there are a lot of answers for this question, but the thing I like the most in Computer Programming is that can build something completely new and powerful only at home and with a laptop,
        and that gives you a lot of power if you want to be a freelance make money with your apps or if you want to be altruistic, you can create something that can help others.
        If you want to see some of my posts, please check this page <a href="/blog">right here</a><br />
      </p>
    </b-row>
    <h3>My Blog</h3>
    <br>
    <b-container>
      <b-col>

        <b-card
            title="Card Title"
            img-src="https://picsum.photos/600/300/?image=25"
            img-alt="Image"
            img-left
            tag="article"
            class="mb-2"
        >
          <b-card-text>
            Some quick example text to build on the card title and make up the bulk of the card's content.
          </b-card-text>


          <b-button href="#" variant="primary">Go somewhere</b-button>


        </b-card>


      </b-col>
    </b-container>

  </b-container>

  <!--
  <b-container class="bv-example-row">
    <b-row   fluid="sm">
      <b-col>
        <h2> My Blog</h2>
      </b-col>
      <b-col>2 of 3</b-col>
      <b-col>3 of 3</b-col>
    </b-row>
  </b-container>-->
</template>

<script>
import { mdbBadge } from 'mdbvue';

export default {
  name: "Home",
  components: {
    mdbBadge
  }
}
</script>

<style lang="scss" scoped>
img {
  display: block;
  margin: 0 auto;
  width: 150px;
}

h1 {
  color: rgba(2, 2, 61, 0.57);
  font-family:  HelvetHelvetica Neueica, sans-serif;
  font-weight: 100;
  font-size: 50px;
}

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
</style>