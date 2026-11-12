/* ===========================================================================
   data/clients.js — WHO THE MODULE CAN BE POINTED AT
   ===========================================================================
   This is the one file to edit when the client loader's list changes. The
   component reads it and draws itself; no name, pill or family grouping is
   written anywhere else.

   THE SHAPE
   ---------
   families : the top level of the list. Each one is itself selectable -
              picking a family loads the family, consolidated.
     id       a key, unique across the whole file. Nothing is shown.
     name     what the row and the header read.
     pills    the little filled labels, in the order they should appear.
              A family carries "Parent" first, as the reference draws it.
     review   the extra label the HEADER shows and the list does not, so
              the row stays short and the header stays complete.
     children the subsidiaries, same fields minus `children`.

   loaded   : the id of whoever is loaded when the page opens.

   All of it is placeholder data standing in for a real client book.
   =========================================================================== */
window.CC_CLIENTS = {

  families: [
    {
      id: 'family-1',
      name: 'Client family 1',
      pills: ['Parent', 'Consolidated', 'Grade: AA', 'Public'],
      review: 'Review status: Value',
      children: [
        { id: 'f1-sub-1', name: 'Subsidiary one',   pills: ['Consolidated', 'Grade: AA', 'Public'], review: 'Review status: Value' },
        { id: 'f1-sub-2', name: 'Subsidiary two',   pills: ['Consolidated', 'Grade: AA', 'Public'], review: 'Review status: Value' },
        { id: 'f1-sub-3', name: 'Subsidiary three', pills: ['Consolidated', 'Grade: AA', 'Public'], review: 'Review status: Value' }
      ]
    },
    {
      id: 'family-2',
      name: 'Client family 2',
      pills: ['Parent', 'Consolidated', 'Grade: AA', 'Public'],
      review: 'Review status: Value',
      children: [
        { id: 'f2-sub-1', name: 'Subsidiary one',   pills: ['Consolidated', 'Grade: AA', 'Public'], review: 'Review status: Value' },
        { id: 'f2-sub-2', name: 'Subsidiary two',   pills: ['Consolidated', 'Grade: AA', 'Public'], review: 'Review status: Value' },
        { id: 'f2-sub-3', name: 'Subsidiary three', pills: ['Consolidated', 'Grade: AA', 'Public'], review: 'Review status: Value' }
      ]
    },
    {
      id: 'family-3',
      name: 'Client family 3',
      pills: ['Parent', 'Consolidated', 'Grade: A', 'Private'],
      review: 'Review status: Value',
      children: [
        { id: 'f3-sub-1', name: 'Subsidiary one', pills: ['Consolidated', 'Grade: A', 'Private'], review: 'Review status: Value' },
        { id: 'f3-sub-2', name: 'Subsidiary two', pills: ['Consolidated', 'Grade: A', 'Private'], review: 'Review status: Value' }
      ]
    }
  ],

  /* the reference opens on client family 2's first subsidiary */
  loaded: 'f2-sub-1'
};
