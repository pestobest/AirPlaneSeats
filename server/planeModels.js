'using strict'

function Plane (id, type, F, P) {
    this.id = id;
    this.type = type;
    this.F = F;
    this.P = P;
}

function Reservation (id, planeId, userId, F, P) {
    this.id = id;
    this.planeId = planeId;
    this.userId = userId;
    this.F = F;
    this.P = P;
}

module.exports = { Plane, Reservation };