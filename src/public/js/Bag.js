class Bag {
    constructor() {
        this.discs = [
            {
                id: 'driver1',
                type: 'driver',
                name: 'Star Destroyer',
                speed: 10,
                glide: 5,
                turn: -1,
                fade: 3,
                color: '#ff7043',
                image: 'img/icons/discs/driver.svg'
            },
            {
                id: 'midrange1',
                type: 'midrange',
                name: 'Buzzz',
                speed: 5,
                glide: 5,
                turn: 0,
                fade: 1,
                color: '#42a5f5',
                image: 'img/icons/discs/midrange.svg'
            },
            {
                id: 'putter1',
                type: 'putter',
                name: 'Aviar',
                speed: 3,
                glide: 3,
                turn: 0,
                fade: 1,
                color: '#ffd54f',
                image: 'img/icons/discs/putter.svg'
            }
        ];

        this.items = [
            {
                id: 'towel1',
                type: 'towel',
                name: 'Disc Towel',
                description: 'Keeps your discs dry',
                image: 'img/icons/items/towel.svg'
            },
            {
                id: 'mini1',
                type: 'mini',
                name: 'Mini Marker',
                description: 'Mark your lie',
                image: 'img/icons/items/mini.svg'
            }
        ];

        this.selectedDisc = this.discs[0];
        this.maxDiscs = 20;
        this.maxItems = 10;
    }

    selectDisc(discId) {
        const disc = this.discs.find(d => d.id === discId);
        if (disc) {
            this.selectedDisc = disc;
            return true;
        }
        return false;
    }

    getSelectedDisc() {
        return this.selectedDisc;
    }

    addDisc(disc) {
        if (this.discs.length < this.maxDiscs) {
            this.discs.push(disc);
            return true;
        }
        return false;
    }

    removeDisc(discId) {
        const index = this.discs.findIndex(d => d.id === discId);
        if (index !== -1) {
            this.discs.splice(index, 1);
            if (this.selectedDisc.id === discId) {
                this.selectedDisc = this.discs[0];
            }
            return true;
        }
        return false;
    }

    addItem(item) {
        if (this.items.length < this.maxItems) {
            this.items.push(item);
            return true;
        }
        return false;
    }

    removeItem(itemId) {
        const index = this.items.findIndex(i => i.id === itemId);
        if (index !== -1) {
            this.items.splice(index, 1);
            return true;
        }
        return false;
    }
} 