'using strict'

function Plane (id, type, F, P) {
    this.id = id;
    this.type = type;
    this.F = F;
    this.P = P;

    this.serialize = () => {
      return { id: this.id, type: this.type, F: this.F, P: this.P };
    }
}

function Reservation (id, planeId, userId, F, P) {
    this.id = id;
    this.planeId = planeId;
    this.userId = userId;
    this.F = F;
    this.P = P;

    this.serialize = () => {
      return { id: this.id, planeId: this.planeId, userId: this.userId, F: this.F, P: this.P };
    }
}

export { Plane, Reservation };