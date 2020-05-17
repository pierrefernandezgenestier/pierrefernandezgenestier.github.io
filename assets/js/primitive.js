"use strict";

// Calcul et renvoie la rotation entre deux axes v1 et v2
//   En supposant v1 et v2 normalisés:
//    - Axe de rotation donné par: v1 x v2 / || v1 x v2 ||
//    - Angle de rotation donné par: acos( <v1,v2> )
//   Rem: Les vecteurs v1 et v2 sont normalisés dans la fonction
// v1: axe de départ [Vector3]
// v2: axe de départ [Vector3]
function RotationBetweenTwoAxes(v1,v2) {
    const v1n = v1.clone().normalize();
    const v2n = v2.clone().normalize();

    const axis = v1n.clone().cross(v2n).normalize();
    const angle = Math.acos( v1n.dot(v2n) );

    return new THREE.Matrix4().makeRotationAxis(axis,angle);
}

const primitive = (function() {

    return {

        Fil: function(L) {
          let geometry = new THREE.CylinderGeometry(0.02,0.02,L,50);
          return geometry;
        },

        // p :position du balloon
        // r : rayon du cône
        // L: longueur du cône
        Balloon: function(p,r,L,drawingData){
          if(drawingData.drawing3DPoints.length==0){
            let geometry=new THREE.ConeGeometry(r,L,64);
            geometry.rotateX(Math.PI);
            geometry.translate(0,L/2,0);

            var h= Math.pow(r,2)/L+L;
            var rs= Math.sqrt( Math.pow(h,2) - L*h);
            let bouleBal=new THREE.SphereGeometry(rs,64,64);
            bouleBal.translate(0,h,0);

            geometry.merge(bouleBal);
            geometry.translate(p.x,p.y,p.z);
            return geometry;
          }

          else{
            const curveShape = new THREE.Shape( drawingData.drawing3DPoints );
            const epaisseur = 0.3;

            const extrudeSettings = { amount: 0, depth: 0, bevelEnabled:true, bevelThickness: 0.18, bevelSize: 0.05, bevelSegments: 150, curveSegments: 100 };
            const geometry = new THREE.ExtrudeBufferGeometry( curveShape, extrudeSettings );
            geometry.center();

            var ymax=drawingData.drawing3DPoints[0].y;
            var ymin=drawingData.drawing3DPoints[0].y;
            for (var i=1 ; i<drawingData.drawing3DPoints.length ; i++) {
              if (ymax<drawingData.drawing3DPoints[i].y) { ymax = drawingData.drawing3DPoints[i].y}
              if (ymin>drawingData.drawing3DPoints[i].y) { ymin = drawingData.drawing3DPoints[i].y}
            }
            var c = (ymax-ymin)/2;
            geometry.translate(0,c,0);
            geometry.translate(p.x,p.y,p.z);
            return geometry;
          }

        },

        // p: Centre du cube [Vector3]
        // L: Longueur d'un coté du cube
        Cube: function(p,L) {
            const geometry = new THREE.BoxGeometry( L,L,L );
            geometry.translate(p.x,p.y,p.z);
            return geometry;
        },

        // p: centre du rectangle
        // lx, ly, lz longueurs de chaque côté
        Rectangle: function(p,Lx,Ly,Lz) {
          const geometry = new THREE.BoxGeometry( Lx,Ly,Lz );
          geometry.translate(p.x,p.y+Ly/2,p.z);
          return geometry;
        },

        // Lx, Lz sont les longueurs projetés sur le plan
        // ax,az : angles par rapport à x et z
        // e : épaisseur
        RectangleInclined: function(p,Lx,ax,Lz,az,e) {
          const geometry = new THREE.BoxGeometry( Lx/Math.cos(ax),e,Lz/ Math.cos(az) );
          const Rx=new THREE.Matrix4().makeRotationAxis(Vector3(1,0,0),az);
          const Rz=new THREE.Matrix4().makeRotationAxis(Vector3(0,0,1),ax);
          geometry.applyMatrix(Rx);
          geometry.applyMatrix(Rz);
          geometry.translate(p.x,p.y,p.z);
          return geometry;
        },

        Roof: function(Lx,Lz){
          var axis= (Lz>Lx) ?  'z' : 'x';
          let geometry;
          switch (axis) {
            case 'x':
              geometry= primitive.RectangleInclined(Vector3(0,Lz/2*0.577/2,Lz/2/2),Lx,0,Lz/2*1.3,3.14/6,Lz/30) ;
              geometry.merge( primitive.RectangleInclined(Vector3(0,Lz/2*0.577/2,-Lz/2/2),Lx,0,Lz/2*1.3,-3.14/6,Lz/30) );
              return geometry
              break;
            case 'z':
              geometry= primitive.RectangleInclined(Vector3(Lx/2/2,Lx/2*0.577/2,0),Lx/2*1.3,-3.14/6,Lz,0,Lx/30) ;
              geometry.merge(primitive.RectangleInclined(Vector3(-Lx/2/2,Lx/2*0.577/2,0),Lx/2*1.3,3.14/6,Lz,0,Lx/30) );
              return geometry
              break;
            default:
          }
        },

        // Cylindre de révolution
        // p0: Point de départ (sur l'axe du cylindre) [Vector3]
        // p1: Point d'arrivée (sur l'axe du cylindre) [Vector3]
        // r: Rayon autour de l'axe
        Cylinder: function(p0,p1,r) {
            const u = p1.clone().sub(p0); // axe du cylindre
            const L = u.length(); // longueur du cylindre
            const geometry = new THREE.CylinderGeometry(r,r,L,20);

            const u0 = new THREE.Vector3(0,1,0); // axe du cylindre par défaut de Three.js
            const R = RotationBetweenTwoAxes(u0,u); // matrice de rotation entre u0 et u

            geometry.translate(0,L/2,0); // translation du cylindre pour placer sa base à l'origine (le cylindre par défaut est centré)
            geometry.applyMatrix(R); // application de la rotation
            geometry.translate(p0.x,p0.y,p0.z); // translation sur le point de départ

            return geometry;
        },

        Quadrangle: function(p0,p1,p2,p3) {
            const n1 = new THREE.Triangle(p0,p1,p2).normal();
            const n2 = new THREE.Triangle(p0,p2,p3).normal();
            const vertices = new Float32Array([
                p0.x,p0.y,p0.z,
                p1.x,p1.y,p1.z,
                p2.x,p2.y,p2.z,

                p0.x,p0.y,p0.z,
                p2.x,p2.y,p2.z,
                p3.x,p3.y,p3.z
            ]);
            const normal = new Float32Array([
                n1.x,n1.y,n1.z,
                n1.x,n1.y,n1.z,
                n1.x,n1.y,n1.z,

                n2.x,n2.y,n2.z,
                n2.x,n2.y,n2.z,
                n2.x,n2.y,n2.z
            ]);
            const uv = new Float32Array([
                0,0,
                1,0,
                1,1,

                0,0,
                1,1,
                0,1
            ]);

            const geometry = new THREE.BufferGeometry();
            geometry.addAttribute('position',new THREE.BufferAttribute(vertices,3));
            geometry.addAttribute('normal',new THREE.BufferAttribute(normal,3));
            geometry.addAttribute('uv',new THREE.BufferAttribute(uv,2));
            geometry.center();

            return geometry;
        },

    };

})();
