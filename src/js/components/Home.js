import { templates } from '../settings.js';

class Home {
    constructor(wrapper) {
        const thisHome = this;

        thisHome.render(wrapper);
    }

    render(wrapper) {
        const thisHome = this;

        const generatedHTML = templates.home();

        thisHome.dom = {};
        thisHome.dom.wrapper = wrapper;

        wrapper.innerHTML = generatedHTML;
    }
}
export default Home;